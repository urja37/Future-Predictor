export type ColumnType = "numeric" | "categorical" | "date" | "id";

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  totalCount: number;
  missingCount: number;
  distinctCount: number;
  uniqueValues?: (string | number)[];
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  median?: number;
}

export interface DatasetProfile {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  previewRows: Record<string, any>[];
  rawRows: Record<string, any>[];
  hasDateColumn: boolean;
  dateColumnCandidate: string | null;
  targetCandidate: string | null;
  featureCandidates: string[];
}

export type ModelMode = "simple" | "multiple" | "time_series";

export interface ModelConfig {
  targetColumn: string;
  featureColumns: string[];
  dateColumn: string | null;
  mode: ModelMode;
  trainRatio: number;
  clipToTargetRange: boolean;
  forecastPeriods: number;
}

export interface CollinearPair {
  featureA: string;
  featureB: string;
  correlation: number;
}

export interface EvaluationMetrics {
  r2: number;
  mae: number;
  rmse: number;
  nTrain: number;
  nTest: number;
  residualStd: number;
  warnings: string[];
  collinearPairs: CollinearPair[];
  vifScores: Record<string, number>;
}

export interface TimeSeriesPoint {
  date: string | Date;
  actual?: number;
  predicted?: number;
  lower?: number;
  upper?: number;
  isForecast?: boolean;
}

export interface TimeSeriesForecastData {
  history: TimeSeriesPoint[];
  forecast: TimeSeriesPoint[];
  combined: TimeSeriesPoint[];
  periods: number;
  dateKey: string;
}

export interface TrainedModel {
  config: ModelConfig;
  intercept: number;
  coefficients: Record<string, number>;
  standardizedCoefficients: Record<string, number>;
  featureMeans: Record<string, number>;
  featureStds: Record<string, number>;
  featureMins: Record<string, number>;
  featureMaxs: Record<string, number>;
  targetMean: number;
  targetStd: number;
  targetMin: number;
  targetMax: number;
  categoricalLevels: Record<string, string[]>;
  metrics: EvaluationMetrics;
  testPredictions: {
    index: number;
    actual: number;
    predicted: number;
  }[];
  simpleRegressionCurve?: {
    featureName: string;
    points: { x: number; actual: number; fit: number }[];
  };
  timeSeries?: TimeSeriesForecastData;
  encodedFeatureNames: string[];
}

export interface FeatureContribution {
  feature: string;
  label: string;
  inputValue: number | string;
  trainingMean: number;
  coefficient: number;
  contribution: number;
  isExtrapolated: boolean;
}

export interface FeatureImportance {
  feature: string;
  label: string;
  importance: number;
  standardizedCoefficient: number;
  direction: "positive" | "negative";
}

export interface PredictionResult {
  rawPrediction: number;
  clippedPrediction: number;
  isClipped: boolean;
  predictionInterval: [number, number];
  residualStd: number;
  baselineMean: number;
  contributions: FeatureContribution[];
  importances: FeatureImportance[];
  extrapolations: string[];
  summarySentence: string;
  dominanceNote?: string;
  counterIntuitiveNote?: string;
}
