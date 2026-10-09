import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Slider } from "./ui/Slider";
import { Badge } from "./ui/Badge";
import type { DatasetProfile, ModelConfig, ModelMode } from "../lib/types";
import { Faders, Play, Calendar, CheckSquare, Square } from "@phosphor-icons/react";

interface ModelConfigViewProps {
  profile: DatasetProfile;
  config: ModelConfig;
  onChangeConfig: (newConfig: ModelConfig) => void;
  onTrainModel: () => void;
  isTraining: boolean;
}

export const ModelConfigView: React.FC<ModelConfigViewProps> = ({
  profile,
  config,
  onChangeConfig,
  onTrainModel,
  isTraining,
}) => {
  const numericColumns = profile.columns.filter((c) => c.type === "numeric");
  const dateColumns = profile.columns.filter((c) => c.type === "date");
  const eligibleFeatureColumns = profile.columns.filter(
    (c) => c.name !== config.targetColumn && c.type !== "id" && c.name !== config.dateColumn
  );

  const determineMode = (
    featuresCount: number,
    dateCol: string | null
  ): ModelMode => {
    if (dateCol) return "time_series";
    if (featuresCount === 1) return "simple";
    return "multiple";
  };

  const handleTargetChange = (newTarget: string) => {
    // Remove newTarget from features
    const updatedFeatures = config.featureColumns.filter((f) => f !== newTarget);
    const newMode = determineMode(updatedFeatures.length, config.dateColumn);
    onChangeConfig({
      ...config,
      targetColumn: newTarget,
      featureColumns: updatedFeatures,
      mode: newMode,
    });
  };

  const toggleFeature = (featureName: string) => {
    let updatedFeatures: string[];
    if (config.featureColumns.includes(featureName)) {
      updatedFeatures = config.featureColumns.filter((f) => f !== featureName);
    } else {
      updatedFeatures = [...config.featureColumns, featureName];
    }
    const newMode = determineMode(updatedFeatures.length, config.dateColumn);
    onChangeConfig({
      ...config,
      featureColumns: updatedFeatures,
      mode: newMode,
    });
  };

  const handleDateChange = (dateCol: string) => {
    const selectedDate = dateCol === "none" ? null : dateCol;
    const newMode = determineMode(config.featureColumns.length, selectedDate);
    onChangeConfig({
      ...config,
      dateColumn: selectedDate,
      mode: newMode,
    });
  };

  const selectAllFeatures = () => {
    const all = eligibleFeatureColumns.map((c) => c.name);
    const newMode = determineMode(all.length, config.dateColumn);
    onChangeConfig({
      ...config,
      featureColumns: all,
      mode: newMode,
    });
  };

  const clearAllFeatures = () => {
    const newMode = determineMode(0, config.dateColumn);
    onChangeConfig({
      ...config,
      featureColumns: [],
      mode: newMode,
    });
  };

  return (
    <Card variant="default">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Faders size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
          <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
            Model Configuration
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#707275] dark:text-[#909499]">Detected mode:</span>
          <Badge
            variant={
              config.mode === "time_series"
                ? "blue"
                : config.mode === "simple"
                ? "yellow"
                : "green"
            }
          >
            {config.mode === "time_series"
              ? "Time-Series Forecast"
              : config.mode === "simple"
              ? "Simple (1 Feature)"
              : "Multivariate Regression"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2]">
              Prediction Target (y)
            </label>
            <p className="text-[11px] text-[#707275] dark:text-[#909499]">
              The numeric variable you want to predict.
            </p>
            <Select
              value={config.targetColumn}
              onChange={(e) => handleTargetChange(e.target.value)}
            >
              {numericColumns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} (Numeric)
                </option>
              ))}
            </Select>
          </div>

          {/* Optional Date Column */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2] flex items-center gap-1.5">
              <Calendar size={13} weight="bold" />
              <span>Date Column (Optional for Time Series)</span>
            </label>
            <p className="text-[11px] text-[#707275] dark:text-[#909499]">
              Select a date column to generate trend, lags, and future forecast.
            </p>
            <Select
              value={config.dateColumn || "none"}
              onChange={(e) => handleDateChange(e.target.value)}
            >
              <option value="none">None (Standard tabular regression)</option>
              {dateColumns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} (Date)
                </option>
              ))}
              {/* Also allow numeric if user wants step/index as time */}
              {numericColumns
                .filter((c) => c.name !== config.targetColumn)
                .map((col) => (
                  <option key={`num-${col.name}`} value={col.name}>
                    {col.name} (Numeric time index)
                  </option>
                ))}
            </Select>
          </div>
        </div>

        {/* Feature Checkboxes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2]">
                Input Features (X)
              </label>
              <span className="text-[11px] text-[#707275] dark:text-[#909499] ml-2">
                ({config.featureColumns.length} selected of {eligibleFeatureColumns.length})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllFeatures}
                className="text-[#707275] hover:text-[#141517] dark:text-[#909499] dark:hover:text-[#F0F1F2] cursor-pointer"
              >
                Select all
              </button>
              <span className="text-[#E6E4DF] dark:text-[#282A2D]">|</span>
              <button
                type="button"
                onClick={clearAllFeatures}
                className="text-[#707275] hover:text-[#141517] dark:text-[#909499] dark:hover:text-[#F0F1F2] cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto p-1">
            {eligibleFeatureColumns.map((col) => {
              const isSelected = config.featureColumns.includes(col.name);
              return (
                <div
                  key={col.name}
                  onClick={() => toggleFeature(col.name)}
                  className={`flex items-center gap-2 p-2 rounded-[6px] border text-xs cursor-pointer select-none transition-all ${
                    isSelected
                      ? "border-indigo-500/60 bg-indigo-50/70 text-indigo-900 font-medium dark:border-indigo-500/60 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-xs"
                      : "border-[#E6E4DF] bg-white text-[#707275] hover:border-indigo-300 dark:border-[#282A2D] dark:bg-[#141517] dark:text-[#909499]"
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={14} weight="fill" className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : (
                    <Square size={14} weight="regular" className="text-[#8C8E91] shrink-0" />
                  )}
                  <span className="truncate">{col.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sliders and Toggles */}
        <div className="pt-2 border-t border-[#E6E4DF] dark:border-[#282A2D] grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Train/Test Split */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#141517] dark:text-[#F0F1F2] font-medium">Train / Test Split</span>
              <span className="font-mono tabular-nums text-[#707275] dark:text-[#909499]">
                {Math.round(config.trainRatio * 100)}% / {Math.round((1 - config.trainRatio) * 100)}%
              </span>
            </div>
            <Slider
              min={0.5}
              max={0.9}
              step={0.05}
              value={config.trainRatio}
              onChange={(val) => onChangeConfig({ ...config, trainRatio: val })}
            />
          </div>

          {/* Target Range Clipping */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#141517] dark:text-[#F0F1F2] flex items-center justify-between cursor-pointer">
              <span>Clip Target Range</span>
              <input
                type="checkbox"
                checked={config.clipToTargetRange}
                onChange={(e) =>
                  onChangeConfig({ ...config, clipToTargetRange: e.target.checked })
                }
                className="rounded text-[#141517] focus:ring-[#141517] cursor-pointer"
              />
            </label>
            <p className="text-[11px] text-[#707275] dark:text-[#909499] leading-tight">
              Constrain output to observed training bounds (like the reference 0-20 grade scale).
            </p>
          </div>

          {/* Time Series Forecast Horizon (if active) */}
          {config.mode === "time_series" && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#141517] dark:text-[#F0F1F2] font-medium">Forecast Horizon</span>
                <span className="font-mono tabular-nums text-[#707275] dark:text-[#909499]">
                  {config.forecastPeriods} periods
                </span>
              </div>
              <Slider
                min={7}
                max={60}
                step={7}
                value={config.forecastPeriods}
                onChange={(val) => onChangeConfig({ ...config, forecastPeriods: val })}
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            disabled={isTraining || config.featureColumns.length === 0}
            onClick={onTrainModel}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2 rounded-[6px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play size={14} weight="fill" />
            <span>{isTraining ? "Training Model..." : "Train Model"}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
