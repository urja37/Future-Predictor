import React from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Moon, Sun, ArrowClockwise, ChartLineUp } from "@phosphor-icons/react";

interface HeaderProps {
  currentDatasetName?: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDatasetName,
  isDarkMode,
  onToggleDarkMode,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E6E4DF] bg-white/95 backdrop-blur-sm dark:border-[#282A2D] dark:bg-[#101112]/95 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white">
            <ChartLineUp size={18} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[#141517] dark:text-[#F0F1F2]">
                Future Predictor
              </span>
              <Badge variant="blue" className="text-[9px] py-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                v1.0
              </Badge>
            </div>
            <p className="text-[11px] text-[#707275] dark:text-[#909499] hidden sm:block">
              Client-side regression, explainability and time-series forecasting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentDatasetName && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-[#707275] dark:text-[#909499]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active:</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-300 font-mono truncate max-w-[140px]">
                {currentDatasetName}
              </span>
            </div>
          )}

          {currentDatasetName && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-xs"
              title="Upload another dataset"
            >
              <ArrowClockwise size={13} weight="bold" />
              <span className="hidden sm:inline">New Data</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDarkMode}
            className="w-8 h-8 p-0"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={15} weight="bold" /> : <Moon size={15} weight="bold" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
