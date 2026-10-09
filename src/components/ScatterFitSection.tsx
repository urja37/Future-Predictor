import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { TrainedModel } from "../lib/types";
import { formatNum } from "../lib/utils";
import { ChartScatter } from "@phosphor-icons/react";

interface ScatterFitSectionProps {
  model: TrainedModel;
}

export const ScatterFitSection: React.FC<ScatterFitSectionProps> = ({ model }) => {
  const { testPredictions, simpleRegressionCurve, config, metrics } = model;
  const [hoveredPoint, setHoveredPoint] = useState<{
    actual: number;
    predicted: number;
    index: number;
  } | null>(null);

  // Calculations for 2D Cartesian Actual vs Predicted plot
  const actuals = testPredictions.map((p) => p.actual);
  const preds = testPredictions.map((p) => p.predicted);
  const minVal = Math.min(...actuals, ...preds);
  const maxVal = Math.max(...actuals, ...preds);
  const range = maxVal - minVal || 1;
  const padding = range * 0.08;
  const plotMin = minVal - padding;
  const plotMax = maxVal + padding;
  const plotRange = plotMax - plotMin;

  // ViewBox coordinates (400 x 300)
  const svgWidth = 460;
  const svgHeight = 320;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 40;
  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  const toSvgX = (val: number) => padLeft + ((val - plotMin) / plotRange) * innerW;
  const toSvgY = (val: number) => padTop + innerH - ((val - plotMin) / plotRange) * innerH;

  return (
    <Card variant="default">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartScatter size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
          <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
            {config.mode === "simple"
              ? "Simple Regression: Feature vs Target Fit Line"
              : "Held-Out Test Fit: Actual vs Predicted"}
          </CardTitle>
        </div>
        <Badge variant="neutral">
          {config.mode === "simple"
            ? `1 Feature (${config.featureColumns[0]})`
            : `${testPredictions.length} Held-Out Test Points`}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 2D Cartesian Calibration Plot */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full relative flex justify-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full max-w-[460px] h-auto select-none overflow-hidden"
              >
                {/* Background Grid */}
                <rect
                  x={padLeft}
                  y={padTop}
                  width={innerW}
                  height={innerH}
                  fill="transparent"
                  stroke="var(--chart-grid)"
                  strokeWidth="1"
                />

                {/* Grid Lines */}
                {[0.25, 0.5, 0.75].map((ratio) => {
                  const gx = padLeft + ratio * innerW;
                  const gy = padTop + ratio * innerH;
                  const val = plotMin + ratio * plotRange;
                  return (
                    <g key={ratio}>
                      <line
                        x1={gx}
                        y1={padTop}
                        x2={gx}
                        y2={padTop + innerH}
                        stroke="var(--chart-grid)"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={padLeft}
                        y1={gy}
                        x2={padLeft + innerW}
                        y2={gy}
                        stroke="var(--chart-grid)"
                        strokeDasharray="3 3"
                      />
                    </g>
                  );
                })}

                {/* 45-degree Perfect Prediction Line (y = x) */}
                <line
                  x1={toSvgX(plotMin)}
                  y1={toSvgY(plotMin)}
                  x2={toSvgX(plotMax)}
                  y2={toSvgY(plotMax)}
                  stroke="#6366F1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeOpacity="0.8"
                />

                {/* Data Points */}
                {testPredictions.map((pt, idx) => {
                  const cx = toSvgX(pt.actual);
                  const cy = toSvgY(pt.predicted);
                  const isHovered = hoveredPoint?.index === pt.index;

                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6.5 : 4}
                      fill={isHovered ? "#4F46E5" : "#06B6D4"}
                      stroke="white"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {/* Axis Labels */}
                <text
                  x={padLeft + innerW / 2}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[11px] fill-[#707275] dark:fill-[#909499] font-sans"
                >
                  Actual Observed Value (y)
                </text>
                <text
                  x={15}
                  y={padTop + innerH / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 15 ${padTop + innerH / 2})`}
                  className="text-[11px] fill-[#707275] dark:fill-[#909499] font-sans"
                >
                  Model Predicted Value (ŷ)
                </text>

                {/* Min / Max Ticks */}
                <text
                  x={padLeft}
                  y={svgHeight - 25}
                  textAnchor="start"
                  className="text-[10px] font-mono fill-[#707275] dark:fill-[#909499]"
                >
                  {formatNum(plotMin, 1)}
                </text>
                <text
                  x={padLeft + innerW}
                  y={svgHeight - 25}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-[#707275] dark:fill-[#909499]"
                >
                  {formatNum(plotMax, 1)}
                </text>
                <text
                  x={padLeft - 8}
                  y={padTop + innerH}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-[#707275] dark:fill-[#909499]"
                >
                  {formatNum(plotMin, 1)}
                </text>
                <text
                  x={padLeft - 8}
                  y={padTop + 10}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-[#707275] dark:fill-[#909499]"
                >
                  {formatNum(plotMax, 1)}
                </text>
              </svg>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#707275] dark:text-[#909499] mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>Test observations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-indigo-500" />
                <span>Ideal 45° calibration line</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Calibration Insights & Hover Inspector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-3.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] space-y-2">
              <div className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2]">
                Fit Calibration Summary
              </div>
              <p className="text-xs text-[#707275] dark:text-[#909499] leading-relaxed">
                Points clustering tightly along the 45-degree diagonal indicate strong predictive
                accuracy. Points above the diagonal represent under-predictions; points below
                represent over-predictions.
              </p>
              <div className="pt-2 border-t border-[#E6E4DF] dark:border-[#282A2D] grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#707275] dark:text-[#909499] block text-[10px]">
                    Average Error (MAE)
                  </span>
                  <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                    ±{formatNum(metrics.mae, 2)}
                  </span>
                </div>
                <div>
                  <span className="text-[#707275] dark:text-[#909499] block text-[10px]">
                    R² Goodness of Fit
                  </span>
                  <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                    {(metrics.r2 * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Hover Inspector */}
            <div className="p-3 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-white dark:bg-[#18191B]">
              <div className="text-[11px] uppercase font-semibold text-[#707275] dark:text-[#909499]">
                Selected Observation
              </div>
              {hoveredPoint ? (
                <div className="mt-1 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#707275]">Record index:</span>
                    <span className="font-medium text-[#141517] dark:text-[#F0F1F2]">
                      #{hoveredPoint.index}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#707275]">Actual target:</span>
                    <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                      {formatNum(hoveredPoint.actual, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#707275]">Model prediction:</span>
                    <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                      {formatNum(hoveredPoint.predicted, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#E6E4DF] dark:border-[#282A2D] pt-1">
                    <span className="text-[#707275]">Residual:</span>
                    <span
                      className={`font-semibold ${
                        hoveredPoint.actual - hoveredPoint.predicted >= 0
                          ? "text-[#346538] dark:text-[#76BC7C]"
                          : "text-[#9F2F2D] dark:text-[#F07B7A]"
                      }`}
                    >
                      {formatNum(hoveredPoint.actual - hoveredPoint.predicted, 2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#707275] dark:text-[#909499] mt-1">
                  Hover over any point on the scatter plot to inspect its residual.
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
