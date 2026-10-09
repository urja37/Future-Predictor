import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNum(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return "-";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompactNum(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "-";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
