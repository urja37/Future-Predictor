import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { TimeSeriesForecastData } from "../lib/types";
import { formatNum, formatDate } from "../lib/utils";
import { ComposedChart, Line, Area, Grid, XAxis, YAxis, ChartTooltip } from "@bklitui/ui/charts";
import { Calendar, TrendUp } from "@phosphor-icons/react";

interface TimeSeriesForecastSectionProps {
  timeSeriesData: TimeSeriesForecastData;
  targetCol: string;
}

export const TimeSeriesForecastSection: React.FC<TimeSeriesForecastSectionProps> = ({
  timeSeriesData,
  targetCol,
}) => {
  const { combined, history, forecast, periods, dateKey } = timeSeriesData;

  // The index where forecast begins
  const historyCount = history.length;

  // Format data points for ComposedChart
  const chartData = combined.map((pt, i) => {
    const isFc = i >= historyCount;
    return {
      date: pt.date instanceof Date ? pt.date : new Date(pt.date),
      actual: pt.actual !== undefined ? +pt.actual.toFixed(2) : undefined,
      seriesValue: isFc ? +pt.predicted!.toFixed(2) : +pt.actual!.toFixed(2),
      forecastUpper: pt.upper !== undefined ? +pt.upper.toFixed(2) : undefined,
      forecastLower: pt.lower !== undefined ? +pt.lower.toFixed(2) : undefined,
    };
  });

  // Calculate high-level forecast statistics
  const forecastVals = forecast.map((f) => f.predicted ?? 0);
  const avgForecast = forecastVals.reduce((a, b) => a + b, 0) / forecastVals.length;
  const lastHistory = history[history.length - 1]?.actual ?? 0;
  const lastForecast = forecast[forecast.length - 1]?.predicted ?? 0;
  const totalChange = lastForecast - lastHistory;

  return (
    <Card variant="default">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
          <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
            Time-Series Trajectory & Next {periods}-Period Forecast
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue">{periods}-Day Rolling Projection</Badge>
          <Badge variant="neutral">Dashed Future Tail</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* KPI Banner with Aesthetic Color Accents */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-blue-500 bg-gradient-to-b from-blue-50/30 to-white dark:from-blue-950/20 dark:to-[#141517] shadow-xs">
            <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
              Latest Recorded Actual
            </div>
            <div className="text-base font-semibold text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
              {formatNum(lastHistory, 1)}
            </div>
          </div>

          <div className="p-3 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-indigo-500 bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/20 dark:to-[#141517] shadow-xs">
            <div className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
              Projected {periods}d End Value
            </div>
            <div className="text-base font-semibold text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
              {formatNum(lastForecast, 1)}
            </div>
          </div>

          <div className="p-3 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-emerald-500 bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-[#141517] shadow-xs">
            <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              Net Projected Drift
            </div>
            <div
              className={`text-base font-semibold mt-0.5 font-mono tabular-nums ${
                totalChange >= 0
                  ? "text-[#346538] dark:text-[#76BC7C]"
                  : "text-[#9F2F2D] dark:text-[#F07B7A]"
              }`}
            >
              {totalChange >= 0 ? "+" : ""}
              {formatNum(totalChange, 1)}
            </div>
          </div>

          <div className="p-3 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-purple-500 bg-gradient-to-b from-purple-50/30 to-white dark:from-purple-950/20 dark:to-[#141517] shadow-xs">
            <div className="text-[10px] font-medium text-purple-700 dark:text-purple-300">
              Forecast Mean
            </div>
            <div className="text-base font-semibold text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
              {formatNum(avgForecast, 1)}
            </div>
          </div>
        </div>

        {/* Bklit ComposedChart (Area band + Line + dashed forecast Line) */}
        <div className="h-72 w-full pt-2">
          <ComposedChart
            data={chartData}
            xDataKey="date"
            aspectRatio="3 / 1"
          >
            <Grid horizontal />
            {/* Shaded 95% Prediction Interval Band */}
            <Area
              dataKey="forecastUpper"
              fill="var(--chart-line-primary)"
              fillOpacity={0.12}
            />
            {/* Main Series Line: solid for history, dashed tail from historyCount */}
            <Line
              dataKey="seriesValue"
              stroke="var(--chart-line-primary)"
              strokeWidth={2}
              dashFromIndex={historyCount}
              dashArray="6,4"
            />
            <XAxis numTicks={8} />
            <YAxis />
            <ChartTooltip />
          </ComposedChart>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#707275] dark:text-[#909499] border-t border-[#E6E4DF] dark:border-[#282A2D] pt-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              <span>Historical Observations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-indigo-600 dark:border-indigo-400" />
              <span>Auto-Regressive Projection (Dashed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[2px] bg-indigo-500/20 border border-indigo-500/40" />
              <span>95% Confidence Interval Band</span>
            </div>
          </div>
          <div className="text-[11px] font-mono">
            Date Axis: {dateKey}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
