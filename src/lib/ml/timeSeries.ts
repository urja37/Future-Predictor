import { solveOLS } from "./matrix";
import type { DatasetProfile, TimeSeriesForecastData, TimeSeriesPoint } from "../types";

export interface TimeSeriesAnalysisResult {
  data: TimeSeriesForecastData;
  r2: number;
  mae: number;
  rmse: number;
  residualStd: number;
  trendSlope: number;
  nTrain: number;
  nTest: number;
  dateKey: string;
}

/**
 * Builds time-series features (trend, lag1, lag7, day-of-week, seasonal) and forecasts next N periods.
 */
export function trainTimeSeriesForecast(
  dataset: DatasetProfile,
  dateCol: string,
  targetCol: string,
  forecastPeriods = 30
): TimeSeriesAnalysisResult {
  const rows = [...dataset.rawRows];

  // Parse and sort by date
  const parsedRows = rows
    .map((r, i) => {
      const d = new Date(r[dateCol]);
      const y = Number(r[targetCol]);
      return {
        date: d,
        timestamp: d.getTime(),
        y: isNaN(y) ? 0 : y,
        original: r,
        index: i,
      };
    })
    .filter((r) => !isNaN(r.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const N = parsedRows.length;
  if (N < 14) {
    throw new Error("Time series requires at least 14 sequential data points.");
  }

  // Detect time step interval (default daily 86400000 ms)
  const diffs: number[] = [];
  for (let i = 1; i < Math.min(20, N); i++) {
    const diff = parsedRows[i].timestamp - parsedRows[i - 1].timestamp;
    if (diff > 0) diffs.push(diff);
  }
  diffs.sort((a, b) => a - b);
  const medianStepMs = diffs.length > 0 ? diffs[Math.floor(diffs.length / 2)] : 86400000;

  // Feature Engineering:
  // Features: [intercept=1, trend t, lag1, lag7, sin_dow, cos_dow, sin_annual, cos_annual]
  const X_features: number[][] = [];
  const y_values: number[] = [];
  const validIndices: number[] = [];

  for (let t = 7; t < N; t++) {
    const item = parsedRows[t];
    const lag1 = parsedRows[t - 1].y;
    const lag7 = parsedRows[t - 7].y;
    const dow = item.date.getDay();
    const sin_dow = Math.sin((2 * Math.PI * dow) / 7);
    const cos_dow = Math.cos((2 * Math.PI * dow) / 7);

    // Day of year
    const startOfYear = new Date(item.date.getFullYear(), 0, 0);
    const diffDays = Math.floor((item.date.getTime() - startOfYear.getTime()) / 86400000);
    const sin_annual = Math.sin((2 * Math.PI * diffDays) / 365.25);
    const cos_annual = Math.cos((2 * Math.PI * diffDays) / 365.25);

    // Design row with intercept
    X_features.push([1, t, lag1, lag7, sin_dow, cos_dow, sin_annual, cos_annual]);
    y_values.push(item.y);
    validIndices.push(t);
  }

  const validN = X_features.length;
  const trainN = Math.floor(validN * 0.8);
  const testN = validN - trainN;

  const X_train = X_features.slice(0, trainN);
  const y_train = y_values.slice(0, trainN);
  const X_test = X_features.slice(trainN);
  const y_test = y_values.slice(trainN);

  // Fit OLS
  const { beta } = solveOLS(X_train, y_train);

  // Train residuals
  const trainPreds = X_train.map((row) =>
    row.reduce((sum, val, idx) => sum + val * beta[idx], 0)
  );
  const sseTrain = y_train.reduce(
    (sum, act, i) => sum + Math.pow(act - trainPreds[i], 2),
    0
  );
  const residualStd = Math.sqrt(sseTrain / Math.max(1, trainN - beta.length));

  // Evaluate on Test Set
  const testPreds = X_test.map((row) =>
    row.reduce((sum, val, idx) => sum + val * beta[idx], 0)
  );
  const sseTest = y_test.reduce(
    (sum, act, i) => sum + Math.pow(act - testPreds[i], 2),
    0
  );
  const testMean = y_test.reduce((a, b) => a + b, 0) / testN;
  const sstTest = y_test.reduce((a, b) => a + Math.pow(b - testMean, 2), 0);
  const r2 = sstTest > 1e-9 ? Math.max(-1, 1 - sseTest / sstTest) : 0;
  const mae = y_test.reduce((acc, act, i) => acc + Math.abs(act - testPreds[i]), 0) / testN;
  const rmse = Math.sqrt(sseTest / testN);

  // Refit on all available data for future forecasting
  const { beta: fullBeta } = solveOLS(X_features, y_values);

  // Build historical series for chart
  const history: TimeSeriesPoint[] = parsedRows.map((r, i) => {
    // If within modeled range, compute fitted value
    let fitted: number | undefined;
    if (i >= 7) {
      const rowIdx = i - 7;
      fitted = X_features[rowIdx].reduce(
        (sum, val, idx) => sum + val * fullBeta[idx],
        0
      );
    }
    return {
      date: r.date,
      actual: r.y,
      predicted: fitted,
      isForecast: false,
    };
  });

  // Iterative Auto-Regressive Rollout for next N steps
  const forecast: TimeSeriesPoint[] = [];
  const simulatedValues = [...parsedRows.map((r) => r.y)];
  let lastTimestamp = parsedRows[parsedRows.length - 1].timestamp;

  for (let step = 1; step <= forecastPeriods; step++) {
    const futureTimestamp = lastTimestamp + step * medianStepMs;
    const futureDate = new Date(futureTimestamp);
    const currT = N - 1 + step;
    const currLag1 = simulatedValues[simulatedValues.length - 1];
    const currLag7 = simulatedValues[simulatedValues.length - 7] ?? currLag1;

    const dow = futureDate.getDay();
    const sin_dow = Math.sin((2 * Math.PI * dow) / 7);
    const cos_dow = Math.cos((2 * Math.PI * dow) / 7);

    const startOfYear = new Date(futureDate.getFullYear(), 0, 0);
    const diffDays = Math.floor((futureDate.getTime() - startOfYear.getTime()) / 86400000);
    const sin_annual = Math.sin((2 * Math.PI * diffDays) / 365.25);
    const cos_annual = Math.cos((2 * Math.PI * diffDays) / 365.25);

    const designRow = [1, currT, currLag1, currLag7, sin_dow, cos_dow, sin_annual, cos_annual];
    const forecastVal = designRow.reduce(
      (sum, val, idx) => sum + val * fullBeta[idx],
      0
    );

    // Confidence interval expands slightly with horizon: sqrt(1 + 0.05 * step)
    const horizonMultiplier = Math.sqrt(1 + 0.04 * step);
    const margin = 1.96 * residualStd * horizonMultiplier;

    simulatedValues.push(forecastVal);

    forecast.push({
      date: futureDate,
      predicted: forecastVal,
      lower: forecastVal - margin,
      upper: forecastVal + margin,
      isForecast: true,
    });
  }

  // Link history and forecast into continuous chart data
  const combined: TimeSeriesPoint[] = [
    ...history,
    ...forecast,
  ];

  return {
    data: {
      history,
      forecast,
      combined,
      periods: forecastPeriods,
      dateKey: dateCol,
    },
    r2,
    mae,
    rmse,
    residualStd,
    trendSlope: fullBeta[1],
    nTrain: trainN,
    nTest: testN,
    dateKey: dateCol,
  };
}
