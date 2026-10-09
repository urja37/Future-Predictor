import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { TrainedModel } from "../lib/types";
import { formatNum } from "../lib/utils";
import { Gauge } from "@bklitui/ui/charts";
import { Gauge as GaugeIcon, Warning, CheckCircle, Info } from "@phosphor-icons/react";

interface ModelEvaluationViewProps {
  model: TrainedModel;
}

export const ModelEvaluationView: React.FC<ModelEvaluationViewProps> = ({ model }) => {
  const { metrics, targetMean } = model;
  const r2Percentage = Math.max(0, Math.min(100, Math.round(metrics.r2 * 100)));

  return (
    <Card variant="default">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <GaugeIcon size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
          <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
            Honest Evaluation & Validation Diagnostics
          </CardTitle>
        </div>
        <Badge variant={metrics.r2 >= 0.7 ? "green" : metrics.r2 >= 0.3 ? "yellow" : "red"}>
          {metrics.r2 >= 0.7
            ? "High Fit"
            : metrics.r2 >= 0.3
            ? "Moderate Fit"
            : "Weak Fit"}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Top Grid: Gauge Dial + Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* R2 Notch Dial from Bklit UI */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-3 rounded-[8px] bg-gradient-to-b from-[#FAFAF8] to-indigo-50/30 dark:from-[#141517] dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-950/60 shadow-xs">
            <div className="w-full max-w-[240px] h-[170px] flex items-center justify-center">
              <Gauge
                value={r2Percentage}
                centerValue={metrics.r2}
                defaultLabel="Test R² (Variance)"
                spacing={20}
                totalNotches={36}
                minWidth={200}
                formatOptions={{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            </div>
            <div className="text-[11px] text-[#707275] dark:text-[#909499] text-center mt-1">
              Held-out evaluation on {metrics.nTest} test records ({100 - Math.round(model.config.trainRatio * 100)}% split)
            </div>
          </div>

          {/* Core Numerical Diagnostics with Aesthetic Top Accents */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-indigo-500 bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/20 dark:to-[#18191B] shadow-xs">
              <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                R² Score (Held-Out)
              </div>
              <div className="text-xl font-bold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
                {formatNum(metrics.r2, 3)}
              </div>
              <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
                Ratio of explained target variance
              </div>
            </div>

            <div className="p-3.5 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-cyan-500 bg-gradient-to-b from-cyan-50/30 to-white dark:from-cyan-950/20 dark:to-[#18191B] shadow-xs">
              <div className="text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                MAE (Mean Abs Error)
              </div>
              <div className="text-xl font-bold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
                {formatNum(metrics.mae, 2)}
              </div>
              <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
                Avg deviation in target units
              </div>
            </div>

            <div className="p-3.5 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-purple-500 bg-gradient-to-b from-purple-50/30 to-white dark:from-purple-950/20 dark:to-[#18191B] shadow-xs">
              <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                RMSE (Root Mean Sq Error)
              </div>
              <div className="text-xl font-bold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
                {formatNum(metrics.rmse, 2)}
              </div>
              <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
                Penalises larger prediction errors
              </div>
            </div>

            <div className="p-3.5 rounded-[8px] border border-[#E6E4DF] dark:border-[#282A2D] border-t-2 border-t-emerald-500 bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-[#18191B] shadow-xs">
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Residual Std Error (se)
              </div>
              <div className="text-xl font-bold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-0.5 font-mono tabular-nums">
                {formatNum(metrics.residualStd, 2)}
              </div>
              <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
                Used for 95% prediction intervals
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Warnings & Integrity Alerts */}
        {metrics.warnings.length > 0 ? (
          <div className="p-3 rounded-[6px] bg-[#FBF3DB]/40 dark:bg-[#2E250E]/30 border border-[#FBF3DB] dark:border-[#423714] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#956400] dark:text-[#DEAE42]">
              <Warning size={14} weight="bold" />
              <span>Statistical Integrity Alerts</span>
            </div>
            <ul className="text-xs text-[#141517] dark:text-[#EDEDED] space-y-1 list-disc list-inside">
              {metrics.warnings.map((w, idx) => (
                <li key={idx} className="leading-relaxed">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-2.5 rounded-[6px] bg-[#EDF3EC]/50 dark:bg-[#152B18]/40 border border-[#EDF3EC] dark:border-[#224A27] flex items-center gap-2 text-xs text-[#346538] dark:text-[#76BC7C]">
            <CheckCircle size={14} weight="bold" />
            <span>Dataset passed collinearity and sample adequacy checks.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
