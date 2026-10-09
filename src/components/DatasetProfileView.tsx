import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { DatasetProfile } from "../lib/types";
import { formatNum, formatCompactNum } from "../lib/utils";
import { Rows, Columns, Table, Calendar, Eye } from "@phosphor-icons/react";

interface DatasetProfileViewProps {
  profile: DatasetProfile;
}

export const DatasetProfileView: React.FC<DatasetProfileViewProps> = ({ profile }) => {
  const [showPreview, setShowPreview] = useState(true);

  const totalMissing = profile.columns.reduce((sum, c) => sum + c.missingCount, 0);

  return (
    <div className="space-y-4">
      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card variant="muted" className="p-3.5 border-l-2 border-l-blue-500/80 bg-white/60 dark:bg-[#18191B]/80 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 text-xs text-[#707275] dark:text-[#909499]">
            <div className="w-5 h-5 rounded-[4px] bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Rows size={12} weight="bold" />
            </div>
            <span className="font-medium">Rows</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-1.5 font-mono tabular-nums">
            {formatNum(profile.rowCount, 0)}
          </div>
          <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
            Observations
          </div>
        </Card>

        <Card variant="muted" className="p-3.5 border-l-2 border-l-purple-500/80 bg-white/60 dark:bg-[#18191B]/80 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 text-xs text-[#707275] dark:text-[#909499]">
            <div className="w-5 h-5 rounded-[4px] bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Columns size={12} weight="bold" />
            </div>
            <span className="font-medium">Columns</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-1.5 font-mono tabular-nums">
            {profile.columnCount}
          </div>
          <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
            Attributes
          </div>
        </Card>

        <Card
          variant="muted"
          className={`p-3.5 border-l-2 bg-white/60 dark:bg-[#18191B]/80 hover:shadow-sm transition-all ${
            totalMissing > 0
              ? "border-l-amber-500/80"
              : "border-l-emerald-500/80"
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-[#707275] dark:text-[#909499]">
            <div
              className={`w-5 h-5 rounded-[4px] flex items-center justify-center ${
                totalMissing > 0
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <Table size={12} weight="bold" />
            </div>
            <span className="font-medium">Missing Values</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-1.5 font-mono tabular-nums">
            {totalMissing}
          </div>
          <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
            {totalMissing > 0 ? "Median-imputed during fit" : "Clean dataset"}
          </div>
        </Card>

        <Card variant="muted" className="p-3.5 border-l-2 border-l-cyan-500/80 bg-white/60 dark:bg-[#18191B]/80 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 text-xs text-[#707275] dark:text-[#909499]">
            <div className="w-5 h-5 rounded-[4px] bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Calendar size={12} weight="bold" />
            </div>
            <span className="font-medium">Temporal Mode</span>
          </div>
          <div className="text-xl font-semibold tracking-tight text-[#141517] dark:text-[#F0F1F2] mt-1.5 truncate">
            {profile.hasDateColumn ? profile.dateColumnCandidate : "None"}
          </div>
          <div className="text-[10px] text-[#707275] dark:text-[#909499] mt-0.5">
            {profile.hasDateColumn ? "Chronological forecast enabled" : "Standard tabular"}
          </div>
        </Card>
      </div>

      {/* Column Schema Summary */}
      <Card variant="default">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-wider text-[#707275] dark:text-[#909499]">
            Column Schema & Summary Statistics
          </CardTitle>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 text-xs text-[#707275] hover:text-[#141517] dark:text-[#909499] dark:hover:text-[#F0F1F2] cursor-pointer"
          >
            <Eye size={12} weight="bold" />
            <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
          </button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#E6E4DF] dark:border-[#282A2D] bg-[#FAFAF8] dark:bg-[#141517] text-[#707275] dark:text-[#909499]">
                  <th className="py-2 px-3 font-medium">Column</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Unique</th>
                  <th className="py-2 px-3 font-medium">Missing</th>
                  <th className="py-2 px-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DF]/60 dark:divide-[#282A2D]/60 font-mono text-[11px]">
                {profile.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-[#FAFAF8] dark:hover:bg-[#18191B]/50 transition-colors">
                    <td className="py-2 px-3 font-medium text-[#141517] dark:text-[#F0F1F2]">
                      {col.name}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={
                          col.type === "numeric"
                            ? "blue"
                            : col.type === "date"
                            ? "green"
                            : col.type === "id"
                            ? "yellow"
                            : "neutral"
                        }
                      >
                        {col.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 tabular-nums">{col.distinctCount}</td>
                    <td className="py-2 px-3 tabular-nums">
                      {col.missingCount > 0 ? (
                        <span className="text-[#9F2F2D] dark:text-[#F07B7A]">{col.missingCount}</span>
                      ) : (
                        <span className="text-[#707275] dark:text-[#909499]">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#707275] dark:text-[#909499]">
                      {col.type === "numeric" && col.min !== undefined && col.max !== undefined ? (
                        <span>
                          [{formatNum(col.min, 1)}, {formatNum(col.max, 1)}] · mean {formatNum(col.mean, 1)}
                        </span>
                      ) : col.type === "categorical" && col.uniqueValues ? (
                        <span className="truncate max-w-xs block font-sans">
                          {col.uniqueValues.slice(0, 4).join(", ")}
                          {col.distinctCount > 4 ? "..." : ""}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw Rows Preview */}
          {showPreview && profile.previewRows.length > 0 && (
            <div className="border-t border-[#E6E4DF] dark:border-[#282A2D]">
              <div className="p-2.5 bg-[#FAFAF8] dark:bg-[#141517] text-[10px] uppercase font-semibold text-[#707275] dark:text-[#909499] tracking-wider">
                Raw Data Preview (First 8 Rows)
              </div>
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left text-[11px] border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-[#E6E4DF] dark:border-[#282A2D] bg-white dark:bg-[#18191B] text-[#707275] dark:text-[#909499]">
                      {profile.columns.map((c) => (
                        <th key={c.name} className="py-1.5 px-3 whitespace-nowrap font-medium">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DF]/40 dark:divide-[#282A2D]/40">
                    {profile.previewRows.slice(0, 8).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#FAFAF8] dark:hover:bg-[#141517]">
                        {profile.columns.map((c) => (
                          <td key={c.name} className="py-1.5 px-3 whitespace-nowrap text-[#141517] dark:text-[#F0F1F2]">
                            {row[c.name] !== null && row[c.name] !== undefined
                              ? String(row[c.name])
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
