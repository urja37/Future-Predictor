import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Badge } from "./ui/Badge";
import type { PredictionResult, TrainedModel } from "../lib/types";
import type { SampleDataset } from "../data/samples";
import { formatNum } from "../lib/utils";
import { Sparkle, Sliders, Warning, ArrowBendDownRight, Check } from "@phosphor-icons/react";

interface PredictionHeroProps {
  model: TrainedModel;
  inputs: Record<string, any>;
  onInputChange: (feature: string, val: any) => void;
  prediction: PredictionResult;
  sampleMeta?: SampleDataset;
  onApplyScenario: (inputs: Record<string, any>) => void;
}

export const PredictionHero: React.FC<PredictionHeroProps> = ({
  model,
  inputs,
  onInputChange,
  prediction,
  sampleMeta,
  onApplyScenario,
}) => {
  const { config, targetMin, targetMax, featureMins, featureMaxs, featureMeans } = model;

  return (
    <div className="space-y-6">
      {/* The Hero Result Card */}
      <Card variant="hero" className="relative overflow-hidden border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/25 dark:from-[#18191B] dark:via-[#151722] dark:to-[#1a1426] shadow-sm">
        {/* Subtle decorative ambient glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <CardContent className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Predicted {config.targetColumn}
                </span>
                {prediction.isClipped && (
                  <Badge variant="yellow" className="text-[9px]">
                    Clipped to [{formatNum(targetMin, 1)}, {formatNum(targetMax, 1)}]
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 font-mono tabular-nums">
                  {formatNum(prediction.clippedPrediction, 2)}
                </span>
                {prediction.isClipped && (
                  <span className="text-xs text-[#707275] dark:text-[#909499] font-mono">
                    (Raw: {formatNum(prediction.rawPrediction, 2)})
                  </span>
                )}
              </div>

              {/* Prediction Interval */}
              <div className="mt-2.5 text-xs flex flex-wrap items-center gap-1.5 font-mono">
                <span className="text-[#707275] dark:text-[#909499]">95% Prediction Interval:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 font-medium">
                  [{formatNum(prediction.predictionInterval[0], 2)} to{" "}
                  {formatNum(prediction.predictionInterval[1], 2)}]
                </span>
                <span className="text-[10px] text-[#8C8E91]">(±1.96 · se)</span>
              </div>
            </div>

            {/* Baseline comparison */}
            <div className="sm:text-right text-xs text-[#707275] dark:text-[#909499] space-y-1.5">
              <div>
                Training Mean Baseline:{" "}
                <span className="font-mono font-medium text-[#141517] dark:text-[#F0F1F2]">
                  {formatNum(prediction.baselineMean, 2)}
                </span>
              </div>
              <div className="flex sm:justify-end items-center gap-1.5">
                <span>Net Offset:</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${
                    prediction.rawPrediction >= prediction.baselineMean
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                  }`}
                >
                  {prediction.rawPrediction >= prediction.baselineMean ? "+" : ""}
                  {formatNum(prediction.rawPrediction - prediction.baselineMean, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Extrapolation Warnings */}
          {prediction.extrapolations.length > 0 && (
            <div className="mt-4 p-2.5 rounded-[6px] bg-[#FDEBEC]/50 dark:bg-[#321718]/40 border border-[#FDEBEC] dark:border-[#4A1E20] flex items-start gap-2 text-xs text-[#9F2F2D] dark:text-[#F07B7A]">
              <Warning size={15} weight="bold" className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Extrapolation Warning:</span> Input values fall
                outside the observed training data range. Linear models can have high error when
                extrapolating.
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px]">
                  {prediction.extrapolations.map((ext, idx) => (
                    <li key={idx}>{ext}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Inputs Form */}
      <Card variant="default">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
            <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
              Feature Inputs (Live Reactive Prediction)
            </CardTitle>
          </div>
          <span className="text-xs text-[#707275] dark:text-[#909499]">
            Drag sliders or enter exact values
          </span>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {config.featureColumns.map((feat) => {
              const isCategorical = Boolean(model.categoricalLevels && model.categoricalLevels[feat]);
              const catLevels = model.categoricalLevels?.[feat] ?? [];

              if (isCategorical) {
                const currentCatVal = String(inputs[feat] ?? catLevels[0] ?? "");
                return (
                  <div
                    key={feat}
                    className="p-3.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2] truncate">
                        {feat}
                      </label>
                      <Badge variant="blue" className="text-[10px]">
                        Categorical
                      </Badge>
                    </div>
                    <Select
                      value={currentCatVal}
                      onChange={(e) => onInputChange(feat, e.target.value)}
                      className="text-xs h-8"
                    >
                      {catLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </Select>
                    <div className="text-[10px] text-[#707275] dark:text-[#909499]">
                      Select from {catLevels.length} observed categories
                    </div>
                  </div>
                );
              }

              const currentVal = inputs[feat] ?? featureMeans[feat] ?? 0;
              const minVal = featureMins[feat] ?? 0;
              const maxVal = featureMaxs[feat] ?? 100;
              const span = maxVal - minVal;
              const step = span > 50 ? 1 : span > 10 ? 0.5 : 0.1;
              const isNumeric = typeof currentVal === "number" || !isNaN(Number(currentVal));

              const isOutOfRange =
                isNumeric && (Number(currentVal) < minVal || Number(currentVal) > maxVal);

              return (
                <div
                  key={feat}
                  className="p-3.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2] truncate">
                      {feat}
                    </label>
                    <div className="flex items-center gap-2">
                      {isOutOfRange && (
                        <Badge variant="red" className="text-[9px]">
                          Out of Bounds
                        </Badge>
                      )}
                      <div className="w-24">
                        <Input
                          type="number"
                          value={currentVal}
                          step={step}
                          onChange={(e) => onInputChange(feat, Number(e.target.value))}
                          className="text-right text-xs h-7 py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {isNumeric && (
                    <div className="space-y-1">
                      <Slider
                        min={minVal}
                        max={maxVal}
                        step={step}
                        value={Number(currentVal)}
                        onChange={(v) => onInputChange(feat, v)}
                      />
                      <div className="flex justify-between text-[10px] text-[#707275] dark:text-[#909499] font-mono">
                        <span>Min: {formatNum(minVal, 1)}</span>
                        <span>Mean: {formatNum(featureMeans[feat], 1)}</span>
                        <span>Max: {formatNum(maxVal, 1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demo Predictions Table */}
      {sampleMeta && sampleMeta.demoPredictions.length > 0 && (
        <Card variant="default">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkle size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
              <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
                Demo Predictions & Benchmark Verification
              </CardTitle>
            </div>
            <span className="text-xs text-[#707275] dark:text-[#909499]">
              Click any scenario to populate inputs
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] text-[#707275] dark:text-[#909499]">
                    <th className="py-2.5 px-4 font-medium">Scenario</th>
                    <th className="py-2.5 px-4 font-medium">Input Parameters</th>
                    <th className="py-2.5 px-4 font-medium">Verification Note</th>
                    <th className="py-2.5 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DF]/60 dark:divide-[#282A2D]/60 text-xs">
                  {sampleMeta.demoPredictions.map((demo, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[#FAFAF8] dark:hover:bg-[#18191B]/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-[#141517] dark:text-[#F0F1F2]">
                        {demo.label}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#707275] dark:text-[#909499]">
                        {Object.entries(demo.inputs)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(", ")}
                      </td>
                      <td className="py-3 px-4 text-[#707275] dark:text-[#909499]">
                        {demo.expectedNote || "Standard scenario"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApplyScenario(demo.inputs)}
                          className="text-xs hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
                        >
                          <ArrowBendDownRight size={13} weight="bold" />
                          <span>Load</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
