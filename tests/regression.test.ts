import { describe, it, expect } from "vitest";
import { invertMatrix, matMul, solveOLS, transpose } from "../src/lib/ml/matrix";
import { profileDataset, trainModel, predictAndExplain } from "../src/lib/ml/regression";
import { trainTimeSeriesForecast } from "../src/lib/ml/timeSeries";
import { SAMPLE_DATASETS } from "../src/data/samples";
import Papa from "papaparse";

describe("Matrix Operations & Closed-Form Inversion", () => {
  it("inverts a known 2x2 matrix accurately", () => {
    // A = [[4, 7], [2, 6]] -> det = 24 - 14 = 10
    // inv(A) = [[0.6, -0.7], [-0.2, 0.4]]
    const A = [
      [4, 7],
      [2, 6],
    ];
    const { inv, wasStabilized } = invertMatrix(A);
    expect(wasStabilized).toBe(false);
    expect(inv[0][0]).toBeCloseTo(0.6, 6);
    expect(inv[0][1]).toBeCloseTo(-0.7, 6);
    expect(inv[1][0]).toBeCloseTo(-0.2, 6);
    expect(inv[1][1]).toBeCloseTo(0.4, 6);

    const product = matMul(A, inv);
    expect(product[0][0]).toBeCloseTo(1, 6);
    expect(product[0][1]).toBeCloseTo(0, 6);
    expect(product[1][0]).toBeCloseTo(0, 6);
    expect(product[1][1]).toBeCloseTo(1, 6);
  });

  it("applies ridge regularisation to singular matrices", () => {
    // Perfectly collinear rows
    const singular = [
      [2, 4],
      [4, 8],
    ];
    const { inv, wasStabilized } = invertMatrix(singular, 1e-3);
    expect(wasStabilized).toBe(true);
    expect(inv).toBeDefined();
    expect(inv.length).toBe(2);
  });

  it("solves simple 1D OLS regression: y = 2x + 3", () => {
    // Data: x = [1, 2, 3, 4, 5], y = [5, 7, 9, 11, 13]
    const X = [
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
    ];
    const y = [5, 7, 9, 11, 13];
    const { beta } = solveOLS(X, y);
    expect(beta[0]).toBeCloseTo(3, 6); // Intercept
    expect(beta[1]).toBeCloseTo(2, 6); // Slope
  });
});

describe("Student Marks Dataset Verification (Notebook Match)", () => {
  it("reproduces the exact coefficients and prediction (14.08) from Future_predictor.ipynb", () => {
    const studentSample = SAMPLE_DATASETS.find((s) => s.id === "student-marks")!;
    const parsed = Papa.parse(studentSample.csvContent, { header: true, dynamicTyping: true, skipEmptyLines: true });
    const profile = profileDataset("student_clean_model.csv", parsed.data as any[]);

    const model = trainModel(profile, {
      targetColumn: "G3",
      featureColumns: ["studytime", "failures", "absences", "G1"],
      dateColumn: null,
      mode: "multiple",
      trainRatio: 1.0, // train on all rows to match notebook's full fit
      clipToTargetRange: true,
      forecastPeriods: 0,
    });

    // Check Notebook coefficients:
    // G1 ~ 0.872, studytime ~ -0.024, absences ~ -0.042, failures ~ -0.069
    expect(model.coefficients["G1"]).toBeCloseTo(0.872, 3);
    expect(model.coefficients["studytime"]).toBeCloseTo(-0.024, 3);
    expect(model.coefficients["absences"]).toBeCloseTo(-0.042, 3);
    expect(model.coefficients["failures"]).toBeCloseTo(-0.069, 3);
    expect(model.intercept).toBeCloseTo(2.028, 3);

    // Predict: studytime=3, failures=0, absences=2, G1=14
    const result = predictAndExplain(model, {
      studytime: 3,
      failures: 0,
      absences: 2,
      G1: 14,
    });

    expect(result.rawPrediction).toBeCloseTo(14.08, 2);
    expect(result.clippedPrediction).toBeCloseTo(14.08, 2);

    // Check contribution breakdown sum
    // Sum of contributions + baselineMean MUST equal rawPrediction
    const sumContributions = result.contributions.reduce((acc, c) => acc + c.contribution, 0);
    expect(result.baselineMean + sumContributions).toBeCloseTo(result.rawPrediction, 6);
  });
});

describe("CSV Edge Cases & Data Robustness", () => {
  it("handles messy CSV with quoted commas, missing values, and empty columns", () => {
    const messySample = SAMPLE_DATASETS.find((s) => s.id === "messy-ecommerce")!;
    const parsed = Papa.parse(messySample.csvContent, { header: true, dynamicTyping: true });
    const profile = profileDataset("messy_dataset.csv", parsed.data as any[]);

    expect(profile.rowCount).toBeGreaterThan(20);
    const nullCol = profile.columns.find((c) => c.name === "all_null_col");
    expect(nullCol).toBeDefined();

    const model = trainModel(profile, {
      targetColumn: "total_sales",
      featureColumns: ["unit_price", "rating"],
      dateColumn: null,
      mode: "multiple",
      trainRatio: 0.8,
      clipToTargetRange: true,
      forecastPeriods: 0,
    });

    expect(model.intercept).toBeDefined();
    expect(model.metrics.r2).toBeDefined();
    expect(model.metrics.rmse).toBeGreaterThan(0);

    const pred = predictAndExplain(model, { unit_price: 25.0, rating: 4.5 });
    expect(pred.clippedPrediction).toBeGreaterThan(0);
  });

  it("handles single feature (simple regression mode)", () => {
    const data = [
      { x: 10, y: 25 },
      { x: 20, y: 45 },
      { x: 30, y: 65 },
      { x: 40, y: 85 },
      { x: 50, y: 105 },
      { x: 60, y: 125 },
    ];
    const profile = profileDataset("simple.csv", data);
    const model = trainModel(profile, {
      targetColumn: "y",
      featureColumns: ["x"],
      dateColumn: null,
      mode: "simple",
      trainRatio: 0.8,
      clipToTargetRange: false,
      forecastPeriods: 0,
    });

    expect(model.coefficients["x"]).toBeCloseTo(2.0, 4);
    expect(model.intercept).toBeCloseTo(5.0, 4);
    expect(model.simpleRegressionCurve).toBeDefined();
    expect(model.simpleRegressionCurve?.points.length).toBe(6);
  });

  it("detects and flags constant target error", () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 10 },
      { x: 3, y: 10 },
      { x: 4, y: 10 },
      { x: 5, y: 10 },
    ];
    const profile = profileDataset("constant.csv", data);
    expect(() =>
      trainModel(profile, {
        targetColumn: "y",
        featureColumns: ["x"],
        dateColumn: null,
        mode: "simple",
        trainRatio: 0.8,
        clipToTargetRange: false,
        forecastPeriods: 0,
      })
    ).toThrow(/constant/i);
  });

  it("detects out-of-bounds input extrapolation", () => {
    const data = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
      { x: 6, y: 12 },
    ];
    const profile = profileDataset("bounds.csv", data);
    const model = trainModel(profile, {
      targetColumn: "y",
      featureColumns: ["x"],
      dateColumn: null,
      mode: "simple",
      trainRatio: 0.8,
      clipToTargetRange: false,
      forecastPeriods: 0,
    });

    const pred = predictAndExplain(model, { x: 50 }); // way beyond max training x of 6
    expect(pred.extrapolations.length).toBeGreaterThan(0);
    expect(pred.extrapolations[0]).toMatch(/outside training range/i);
  });
});

describe("Time Series Recursive Forecasting", () => {
  it("forecasts future periods with trend, seasonality, and intervals", () => {
    const elecSample = SAMPLE_DATASETS.find((s) => s.id === "electricity-demand")!;
    const parsed = Papa.parse(elecSample.csvContent, { header: true, dynamicTyping: true });
    const profile = profileDataset("electricity.csv", parsed.data as any[]);

    const tsResult = trainTimeSeriesForecast(profile, "date", "consumption_kwh", 30);
    expect(tsResult.data.forecast.length).toBe(30);
    expect(tsResult.data.combined.length).toBe(profile.rowCount + 30);
    expect(tsResult.residualStd).toBeGreaterThan(0);

    const firstForecast = tsResult.data.forecast[0];
    expect(firstForecast.predicted).toBeDefined();
    expect(firstForecast.lower).toBeLessThan(firstForecast.predicted!);
    expect(firstForecast.upper).toBeGreaterThan(firstForecast.predicted!);
  });
});
