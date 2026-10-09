import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Header } from "./components/Header";
import { DatasetUpload } from "./components/DatasetUpload";
import { DatasetProfileView } from "./components/DatasetProfileView";
import { ModelConfigView } from "./components/ModelConfigView";
import { ModelEvaluationView } from "./components/ModelEvaluationView";
import { PredictionHero } from "./components/PredictionHero";
import { ExplanationSection } from "./components/ExplanationSection";
import { TimeSeriesForecastSection } from "./components/TimeSeriesForecastSection";
import { ScatterFitSection } from "./components/ScatterFitSection";
import { HowItWasCalculated } from "./components/HowItWasCalculated";
import { Card, CardContent } from "./components/ui/Card";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { SAMPLE_DATASETS, type SampleDataset } from "./data/samples";
import { profileDataset, trainModel, predictAndExplain } from "./lib/ml/regression";
import { trainTimeSeriesForecast } from "./lib/ml/timeSeries";
import type { DatasetProfile, ModelConfig, TrainedModel, PredictionResult } from "./lib/types";
import { WarningCircle, Sparkle, ArrowClockwise } from "@phosphor-icons/react";

export function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("future_predictor_theme");
      if (saved) return saved === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [datasetProfile, setDatasetProfile] = useState<DatasetProfile | null>(null);
  const [sampleMeta, setSampleMeta] = useState<SampleDataset | undefined>(undefined);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    targetColumn: "",
    featureColumns: [],
    dateColumn: null,
    mode: "multiple",
    trainRatio: 0.8,
    clipToTargetRange: true,
    forecastPeriods: 30,
  });

  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Sync dark mode class on document element and persist preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("future_predictor_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("future_predictor_theme", "light");
    }
  }, [isDarkMode]);

  // Load default sample dataset on first mount (Student Academic Performance)
  useEffect(() => {
    const defaultSample = SAMPLE_DATASETS[0];
    try {
      const parsed = Papa.parse(defaultSample.csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      loadDatasetRows(defaultSample.filename, parsed.data as Record<string, any>[], defaultSample);
    } catch (e: any) {
      console.error("Failed to load default dataset:", e);
    }
  }, []);

  const loadDatasetRows = (
    filename: string,
    rawRows: Record<string, any>[],
    sample?: SampleDataset
  ) => {
    setErrorBanner(null);
    try {
      const profile = profileDataset(filename, rawRows);
      setDatasetProfile(profile);
      setSampleMeta(sample);

      // Configure model
      const targetCol =
        sample?.targetCol && profile.columns.some((c) => c.name === sample.targetCol)
          ? sample.targetCol
          : profile.targetCandidate!;

      let featureCols = sample?.featureCols
        ? sample.featureCols.filter((f) => profile.columns.some((c) => c.name === f))
        : profile.featureCandidates;

      if (featureCols.length === 0) {
        featureCols = profile.featureCandidates.slice(0, 4);
      }

      const dateCol = sample?.dateCol ?? profile.dateColumnCandidate;
      const mode = sample?.mode ?? (dateCol ? "time_series" : featureCols.length === 1 ? "simple" : "multiple");
      const clipRange = sample?.clipRange ?? true;

      const initialConfig: ModelConfig = {
        targetColumn: targetCol,
        featureColumns: featureCols,
        dateColumn: dateCol,
        mode,
        trainRatio: 0.8,
        clipToTargetRange: clipRange,
        forecastPeriods: 30,
      };

      setModelConfig(initialConfig);

      // Automatically train model
      runModelTraining(profile, initialConfig, sample);
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to initialize dataset.");
    }
  };

  const runModelTraining = (
    profile: DatasetProfile,
    config: ModelConfig,
    sample?: SampleDataset
  ) => {
    setIsTraining(true);
    setErrorBanner(null);

    try {
      // Train regression model
      const model = trainModel(profile, config);

      // If time series mode and date column exists, run time series engine
      if (config.mode === "time_series" && config.dateColumn) {
        const tsResult = trainTimeSeriesForecast(
          profile,
          config.dateColumn,
          config.targetColumn,
          config.forecastPeriods
        );
        model.timeSeries = tsResult.data;
      }

      setTrainedModel(model);

      // Set initial inputs (use demo prediction 0 if available, else feature means)
      let initialInputs: Record<string, any> = {};
      if (sample && sample.demoPredictions.length > 0) {
        initialInputs = { ...sample.demoPredictions[0].inputs };
      }

      for (const f of config.featureColumns) {
        if (initialInputs[f] === undefined) {
          initialInputs[f] = model.featureMeans[f] ?? 0;
        }
      }

      setInputs(initialInputs);

      // Initial prediction
      const initialPred = predictAndExplain(model, initialInputs);
      setPrediction(initialPred);
    } catch (err: any) {
      setErrorBanner(err.message || "Model training failed.");
      setTrainedModel(null);
      setPrediction(null);
    } finally {
      setIsTraining(false);
    }
  };

  const handleInputChange = (feature: string, val: any) => {
    const updatedInputs = { ...inputs, [feature]: val };
    setInputs(updatedInputs);

    if (trainedModel) {
      const pred = predictAndExplain(trainedModel, updatedInputs);
      setPrediction(pred);
    }
  };

  const handleApplyScenario = (scenarioInputs: Record<string, any>) => {
    const updatedInputs = { ...inputs, ...scenarioInputs };
    setInputs(updatedInputs);
    if (trainedModel) {
      const pred = predictAndExplain(trainedModel, updatedInputs);
      setPrediction(pred);
    }
  };

  const handleManualTrain = () => {
    if (datasetProfile) {
      runModelTraining(datasetProfile, modelConfig, sampleMeta);
    }
  };

  const handleReset = () => {
    setDatasetProfile(null);
    setTrainedModel(null);
    setPrediction(null);
    setSampleMeta(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#101112] transition-colors">
      <Header
        currentDatasetName={datasetProfile?.name}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Error Callout */}
        {errorBanner && (
          <div className="p-4 rounded-[8px] bg-[#FDEBEC] dark:bg-[#321718] border border-[#FDEBEC] dark:border-[#4A1E20] flex items-center justify-between text-xs text-[#9F2F2D] dark:text-[#F07B7A]">
            <div className="flex items-center gap-2">
              <WarningCircle size={16} weight="bold" className="shrink-0" />
              <span className="font-medium">{errorBanner}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setErrorBanner(null)}
              className="text-xs h-7"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* 1. Upload or Change Dataset */}
        {!datasetProfile ? (
          <div className="py-6 space-y-4">
            <div className="text-center max-w-lg mx-auto space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#141517] dark:text-[#F0F1F2]">
                Future Predictor
              </h1>
              <p className="text-xs text-[#707275] dark:text-[#909499] leading-relaxed">
                Upload any tabular CSV dataset or pick a sample below. Get instant accurate predictions,
                detailed factor explanations, and time-series forecasts with zero server roundtrips.
              </p>
            </div>
            <DatasetUpload onDatasetLoaded={loadDatasetRows} isLoading={isTraining} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 2. Dataset Profile & Preview */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 1: Dataset Profile & Schema
                  </h2>
                </div>
                <Badge variant="neutral">
                  {datasetProfile.rowCount} Rows · {datasetProfile.columnCount} Cols
                </Badge>
              </div>
              <DatasetProfileView profile={datasetProfile} />
            </section>

            {/* 3. Model Configuration */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                  Step 2: Prediction Target & Features
                </h2>
              </div>
              <ModelConfigView
                profile={datasetProfile}
                config={modelConfig}
                onChangeConfig={setModelConfig}
                onTrainModel={handleManualTrain}
                isTraining={isTraining}
              />
            </section>

            {/* 4. Model Evaluation & Honest Diagnostics */}
            {trainedModel && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 3: Model Evaluation
                  </h2>
                </div>
                <ModelEvaluationView model={trainedModel} />
              </section>
            )}

            {/* 5. Live Prediction Hero Card & Inputs */}
            {trainedModel && prediction && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 4: Interactive Prediction & Factor Control
                  </h2>
                </div>
                <PredictionHero
                  model={trainedModel}
                  inputs={inputs}
                  onInputChange={handleInputChange}
                  prediction={prediction}
                  sampleMeta={sampleMeta}
                  onApplyScenario={handleApplyScenario}
                />
              </section>
            )}

            {/* 6. Factor Explanation & Waterfall Breakdown */}
            {trainedModel && prediction && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 5: Factor Influence & Waterfall Breakdown
                  </h2>
                </div>
                <ExplanationSection model={trainedModel} prediction={prediction} />
              </section>
            )}

            {/* 7. Time Series Forecast (if date column present) */}
            {trainedModel && trainedModel.timeSeries && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 6: Time-Series Forecast (Next {modelConfig.forecastPeriods} Periods)
                  </h2>
                </div>
                <TimeSeriesForecastSection
                  timeSeriesData={trainedModel.timeSeries}
                  targetCol={modelConfig.targetColumn}
                />
              </section>
            )}

            {/* 8. Actual vs Predicted Scatter Calibration Plot */}
            {trainedModel && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 7: Calibration & Distribution Plot
                  </h2>
                </div>
                <ScatterFitSection model={trainedModel} />
              </section>
            )}

            {/* 9. Mathematical Transparency (How it was calculated) */}
            {trainedModel && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                    Step 8: Mathematical Transparency
                  </h2>
                </div>
                <HowItWasCalculated model={trainedModel} />
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E4DF] dark:border-[#282A2D] py-6 px-4 text-center text-xs text-[#707275] dark:text-[#909499] bg-white dark:bg-[#101112]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Future Predictor · Client-Side Tabular ML & Time-Series Engine</span>
          <span>Charts powered by Bklit UI · Zero server roundtrips</span>
        </div>
      </footer>
    </div>
  );
}
