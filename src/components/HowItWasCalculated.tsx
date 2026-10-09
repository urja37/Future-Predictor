import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { TrainedModel } from "../lib/types";
import { formatNum } from "../lib/utils";
import { Code, CaretDown, CaretUp, Calculator } from "@phosphor-icons/react";

interface HowItWasCalculatedProps {
  model: TrainedModel;
}

export const HowItWasCalculated: React.FC<HowItWasCalculatedProps> = ({ model }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    intercept,
    coefficients,
    standardizedCoefficients,
    featureMeans,
    featureStds,
    featureMins,
    featureMaxs,
    metrics,
    encodedFeatureNames,
    config,
  } = model;

  // Build formula text representation
  const formulaTerms = encodedFeatureNames
    .map((feat) => {
      const coeff = coefficients[feat] || 0;
      const sign = coeff >= 0 ? "+" : "-";
      return `${sign} (${Math.abs(coeff).toFixed(3)} · ${feat})`;
    })
    .join(" ");

  const formulaString = `ŷ = ${intercept.toFixed(3)} ${formulaTerms}`;

  return (
    <Card variant="default">
      <CardHeader
        className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Calculator size={15} weight="bold" className="text-[#141517] dark:text-[#EDEDED]" />
          <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
            Mathematical Transparency: How This Was Calculated
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Exact Normal Equations</Badge>
          <button className="text-[#707275] dark:text-[#909499]">
            {isExpanded ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Formula Display Box */}
          <div className="p-3.5 rounded-[8px] bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:from-indigo-950/30 dark:via-purple-950/15 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Fitted Linear Regression Equation
            </div>
            <div className="font-mono text-xs sm:text-sm text-indigo-950 dark:text-indigo-100 font-semibold overflow-x-auto py-1">
              {formulaString}
            </div>
            <p className="text-[11px] text-[#707275] dark:text-[#909499] leading-relaxed">
              Fitted via closed-form OLS normal equations β = (XᵀX)⁻¹Xᵀy. Imputes missing entries using
              training column medians.
            </p>
          </div>

          {/* Full Coefficients & Training Statistics Table */}
          <div className="border border-[#E6E4DF] dark:border-[#282A2D] rounded-[6px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] text-[#707275] dark:text-[#909499]">
                    <th className="py-2.5 px-3 font-medium">Factor / Variable</th>
                    <th className="py-2.5 px-3 font-medium text-right">Raw Coeff (β)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Standardised (β*)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Training Mean (x̄)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Std Dev (σ)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Training Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DF]/60 dark:divide-[#282A2D]/60 font-mono text-[11px]">
                  {/* Intercept row */}
                  <tr className="bg-[#FAFAF8]/50 dark:bg-[#141517]/40 font-semibold">
                    <td className="py-2 px-3 text-[#141517] dark:text-[#F0F1F2] font-sans">
                      Intercept (β₀)
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {formatNum(intercept, 4)}
                    </td>
                    <td className="py-2 px-3 text-right text-[#707275] dark:text-[#909499]">-</td>
                    <td className="py-2 px-3 text-right text-[#707275] dark:text-[#909499]">-</td>
                    <td className="py-2 px-3 text-right text-[#707275] dark:text-[#909499]">-</td>
                    <td className="py-2 px-3 text-right text-[#707275] dark:text-[#909499]">-</td>
                  </tr>

                  {/* Feature rows */}
                  {encodedFeatureNames.map((feat) => (
                    <tr key={feat} className="hover:bg-[#FAFAF8] dark:hover:bg-[#18191B]/50">
                      <td className="py-2 px-3 text-[#141517] dark:text-[#F0F1F2] font-sans font-medium">
                        {feat}
                      </td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums ${
                          (coefficients[feat] || 0) >= 0
                            ? "text-[#346538] dark:text-[#76BC7C]"
                            : "text-[#9F2F2D] dark:text-[#F07B7A]"
                        }`}
                      >
                        {(coefficients[feat] || 0) >= 0 ? "+" : ""}
                        {formatNum(coefficients[feat], 4)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#141517] dark:text-[#F0F1F2]">
                        {formatNum(standardizedCoefficients[feat], 4)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#707275] dark:text-[#909499]">
                        {formatNum(featureMeans[feat], 2)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#707275] dark:text-[#909499]">
                        {formatNum(featureStds[feat], 2)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#707275] dark:text-[#909499]">
                        [{formatNum(featureMins[feat], 1)}, {formatNum(featureMaxs[feat], 1)}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Training & Split Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517]">
              <span className="text-[10px] text-[#707275] dark:text-[#909499] block font-sans">
                Training Split (N_train)
              </span>
              <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                {metrics.nTrain} rows ({Math.round(config.trainRatio * 100)}%)
              </span>
            </div>

            <div className="p-2.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517]">
              <span className="text-[10px] text-[#707275] dark:text-[#909499] block font-sans">
                Validation Split (N_test)
              </span>
              <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                {metrics.nTest} rows ({100 - Math.round(config.trainRatio * 100)}%)
              </span>
            </div>

            <div className="p-2.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517]">
              <span className="text-[10px] text-[#707275] dark:text-[#909499] block font-sans">
                Degrees of Freedom
              </span>
              <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                {Math.max(1, metrics.nTrain - encodedFeatureNames.length - 1)}
              </span>
            </div>

            <div className="p-2.5 rounded-[6px] border border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517]">
              <span className="text-[10px] text-[#707275] dark:text-[#909499] block font-sans">
                Residual Variance (s²)
              </span>
              <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">
                {formatNum(Math.pow(metrics.residualStd, 2), 2)}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
