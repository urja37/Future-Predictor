import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { PredictionResult, TrainedModel } from "../lib/types";
import { formatNum, cn } from "../lib/utils";
import { BarChart, Bar, BarXAxis, BarYAxis, Grid, ChartTooltip } from "@bklitui/ui/charts";
import { Lightbulb, Info, Scales, Warning } from "@phosphor-icons/react";

interface ExplanationSectionProps {
  model: TrainedModel;
  prediction: PredictionResult;
}

export const ExplanationSection: React.FC<ExplanationSectionProps> = ({
  model,
  prediction,
}) => {
  const { contributions, importances, summarySentence, dominanceNote, counterIntuitiveNote } =
    prediction;

  // Prepare chart data for contributions (magnitudes >= 0 for BarChart rect elements)
  const contributionChartData = contributions.map((c) => ({
    name: c.label,
    positive: c.contribution >= 0 ? +c.contribution.toFixed(3) : 0,
    negative: c.contribution < 0 ? +Math.abs(c.contribution).toFixed(3) : 0,
    impact: +c.contribution.toFixed(3),
  }));

  // Prepare chart data for standardized importance
  const importanceChartData = importances.map((imp) => ({
    feature: imp.label,
    importance: +imp.importance.toFixed(3),
  }));

  return (
    <div className="space-y-6">
      {/* Plain-English Synthesis & Insights */}
      <Card variant="default">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
            <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
              Model Explanation & Factor Influence
            </CardTitle>
          </div>
          <Badge variant="blue">Correlation, Not Causation</Badge>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Natural Language Sentence */}
          <div className="p-3.5 rounded-[6px] bg-[#FAFAF8] dark:bg-[#141517] border border-[#E6E4DF] dark:border-[#282A2D]">
            <div className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2] leading-relaxed">
              {summarySentence}
            </div>
            <p className="text-[11px] text-[#707275] dark:text-[#909499] mt-1 leading-relaxed">
              Factors with positive impact push the estimate above the baseline mean; factors with
              negative impact pull it below.
            </p>
          </div>

          {/* Dominance and Counter-intuitive Alerts */}
          {dominanceNote && (
            <div className="p-3 rounded-[6px] bg-[#FBF3DB]/40 dark:bg-[#2E250E]/30 border border-[#FBF3DB] dark:border-[#423714] text-xs text-[#141517] dark:text-[#EDEDED] flex items-start gap-2">
              <Warning size={14} weight="bold" className="text-[#956400] dark:text-[#DEAE42] shrink-0 mt-0.5" />
              <span>{dominanceNote}</span>
            </div>
          )}

          {counterIntuitiveNote && (
            <div className="p-3 rounded-[6px] bg-[#E1F3FE]/40 dark:bg-[#122A3B]/30 border border-[#E1F3FE] dark:border-[#1E435E] text-xs text-[#141517] dark:text-[#EDEDED] flex items-start gap-2">
              <Info size={14} weight="bold" className="text-[#1F6C9F] dark:text-[#67B2E4] shrink-0 mt-0.5" />
              <span>{counterIntuitiveNote}</span>
            </div>
          )}

          {/* Mandatory Disclaimer */}
          <div className="text-[11px] text-[#707275] dark:text-[#909499] border-t border-[#E6E4DF] dark:border-[#282A2D] pt-3 leading-relaxed flex items-center gap-1.5">
            <Scales size={14} weight="bold" className="shrink-0" />
            <span>
              <strong>Methodological notice:</strong> This reflects observed statistical correlation,
              not causation. Changing an input factor in reality may not alter the real-world outcome
              if unmeasured confounders exist.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid: Contribution Breakdown + Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Contribution Breakdown */}
        <Card variant="default">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
              Per-Prediction Contribution Breakdown
            </CardTitle>
            <p className="text-[11px] text-[#707275] dark:text-[#909499] mt-0.5">
              Contribution = β · (x - x̄). Added to the baseline mean ({formatNum(prediction.baselineMean, 2)}), the contributions sum exactly to {formatNum(prediction.rawPrediction, 2)}.
            </p>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Visual Bklit Bar Chart */}
            <div className="h-56 w-full">
              <BarChart data={contributionChartData} xDataKey="name">
                <Grid horizontal />
                <Bar dataKey="positive" lineCap="round" fill="#10B981" />
                <Bar dataKey="negative" lineCap="round" fill="#F43F5E" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </div>

            {/* Exact Waterfall Table */}
            <div className="border border-[#E6E4DF] dark:border-[#282A2D] rounded-[6px] overflow-hidden text-xs">
              <div className="p-2 bg-[#FAFAF8] dark:bg-[#141517] flex justify-between font-mono font-medium border-b border-[#E6E4DF] dark:border-[#282A2D]">
                <span>Training Baseline Mean</span>
                <span>{formatNum(prediction.baselineMean, 2)}</span>
              </div>
              <div className="divide-y divide-[#E6E4DF]/50 dark:divide-[#282A2D]/50 font-mono text-[11px]">
                {contributions.map((c) => (
                  <div
                    key={c.feature}
                    className="p-2 flex items-center justify-between hover:bg-[#FAFAF8] dark:hover:bg-[#18191B]/40"
                  >
                    <div>
                      <span className="font-sans font-medium text-[#141517] dark:text-[#F0F1F2]">
                        {c.label}
                      </span>
                      <span className="text-[10px] text-[#707275] dark:text-[#909499] ml-1.5">
                        (input: {c.inputValue}, mean: {formatNum(c.trainingMean, 1)})
                      </span>
                    </div>
                    <span
                      className={`font-semibold tabular-nums ${
                        c.contribution >= 0
                          ? "text-[#346538] dark:text-[#76BC7C]"
                          : "text-[#9F2F2D] dark:text-[#F07B7A]"
                      }`}
                    >
                      {c.contribution >= 0 ? "+" : ""}
                      {formatNum(c.contribution, 3)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-[#FAFAF8] dark:bg-[#141517] flex justify-between font-mono font-bold border-t border-[#E6E4DF] dark:border-[#282A2D]">
                <span>Total Prediction (Raw)</span>
                <span>{formatNum(prediction.rawPrediction, 2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standardized Feature Importance Ranking */}
        <Card variant="default">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
              Standardised Feature Importance
            </CardTitle>
            <p className="text-[11px] text-[#707275] dark:text-[#909499] mt-0.5">
              Unit-free relative impact |β| · σ(X) / σ(y) ranked by explanatory strength across the entire dataset.
            </p>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Visual Bklit Bar Chart */}
            <div className="h-56 w-full">
              <BarChart data={importanceChartData} xDataKey="feature">
                <Grid horizontal />
                <Bar dataKey="importance" lineCap="round" fill="#6366F1" />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </div>

            {/* Importance Ranking List */}
            <div className="space-y-2">
              {importances.map((imp, idx) => {
                const maxImp = importances[0]?.importance || 1;
                const pct = Math.max(5, Math.round((imp.importance / maxImp) * 100));
                const rankGradient =
                  idx === 0
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : idx === 1
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                    : idx === 2
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-slate-400 dark:bg-slate-600";

                return (
                  <div
                    key={imp.feature}
                    className="p-2.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                          {imp.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <Badge variant={imp.direction === "positive" ? "green" : "red"}>
                          {imp.direction}
                        </Badge>
                        <span className="tabular-nums font-medium text-[#141517] dark:text-[#F0F1F2]">
                          {formatNum(imp.importance, 3)}
                        </span>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-[#E6E4DF] dark:bg-[#282A2D] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", rankGradient)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
