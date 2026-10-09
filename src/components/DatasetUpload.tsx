import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { SAMPLE_DATASETS, type SampleDataset } from "../data/samples";
import { UploadSimple, FileText, WarningCircle, Sparkle } from "@phosphor-icons/react";

interface DatasetUploadProps {
  onDatasetLoaded: (name: string, rawRows: Record<string, any>[], sampleMeta?: SampleDataset) => void;
  isLoading: boolean;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({ onDatasetLoaded, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvText = (filename: string, text: string, sampleMeta?: SampleDataset) => {
    setErrorMessage(null);
    try {
      const parsed = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        setErrorMessage(`CSV parse error: ${parsed.errors[0].message}`);
        return;
      }

      const rows = parsed.data as Record<string, any>[];
      if (rows.length === 0) {
        setErrorMessage("Uploaded file contains no valid rows.");
        return;
      }

      onDatasetLoaded(filename, rows, sampleMeta);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse CSV file.");
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setErrorMessage("Please upload a standard tabular CSV file (.csv).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleCsvText(file.name, text);
    };
    reader.onerror = () => {
      setErrorMessage("Could not read file from disk.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const loadSample = (sample: SampleDataset) => {
    handleCsvText(sample.filename, sample.csvContent, sample);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card
        variant="default"
        className={`border-dashed transition-all duration-200 ${
          dragActive
            ? "border-indigo-500 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10"
            : "border-[#E6E4DF] dark:border-[#282A2D] hover:border-indigo-400/60 dark:hover:border-indigo-600/60"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-[10px] bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-inner">
            <UploadSimple size={22} weight="bold" />
          </div>

          <h3 className="text-sm font-semibold text-[#141517] dark:text-[#F0F1F2] tracking-tight">
            Drop your CSV file here, or browse
          </h3>
          <p className="text-xs text-[#707275] dark:text-[#909499] mt-1 max-w-sm leading-relaxed">
            Upload any tabular CSV dataset. All data processing and regression runs entirely inside your browser for total privacy.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center text-xs font-semibold px-3.5 py-1.5 rounded-[6px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Choose File
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#FDEBEC] dark:bg-[#321718] text-[#9F2F2D] dark:text-[#F07B7A] text-xs">
              <WarningCircle size={14} weight="bold" />
              <span>{errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bundled Samples Picker */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkle size={14} weight="bold" className="text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-900/80 dark:text-indigo-300">
            Or select a bundled sample dataset
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_DATASETS.map((sample, idx) => {
            const themes = [
              {
                iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                hoverBorder: "hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/5",
                badgeCls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
                accentTag: "Tabular OLS",
              },
              {
                iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                hoverBorder: "hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/5",
                badgeCls: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
                accentTag: "Multivariate",
              },
              {
                iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
                hoverBorder: "hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/5",
                badgeCls: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
                accentTag: "Time Series",
              },
              {
                iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                hoverBorder: "hover:border-rose-500/60 hover:shadow-lg hover:shadow-rose-500/5",
                badgeCls: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
                accentTag: "Stress Test",
              },
            ];
            const theme = themes[idx % themes.length];

            return (
              <Card
                key={sample.id}
                variant="default"
                className={`cursor-pointer transition-all duration-200 group flex flex-col justify-between ${theme.hoverBorder}`}
                onClick={() => loadSample(sample)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                      <FileText size={14} weight="bold" />
                    </div>
                    <span className="text-xs font-semibold text-[#141517] dark:text-[#F0F1F2] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sample.title}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#707275] dark:text-[#909499] line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E6E4DF]/60 dark:border-[#282A2D]/60">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${theme.badgeCls}`}>
                      {theme.accentTag}
                    </span>
                    <span className="text-[10px] text-[#707275] dark:text-[#909499] font-mono">
                      Target: <span className="font-semibold text-[#141517] dark:text-[#F0F1F2]">{sample.targetCol}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
