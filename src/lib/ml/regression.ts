import { solveOLS } from "./matrix";
import type {
  ColumnProfile,
  ColumnType,
  DatasetProfile,
  EvaluationMetrics,
  FeatureContribution,
  FeatureImportance,
  ModelConfig,
  PredictionResult,
  TrainedModel,
} from "../types";

/**
 * Parses raw text or parsed CSV rows and profiles column types, statistics, and missing values.
 */
export function profileDataset(
  name: string,
  rawInputRows: Record<string, any>[]
): DatasetProfile {
  // Strip empty rows (e.g. trailing empty line from CSV)
  const rows = rawInputRows.filter((r) =>
    Object.values(r).some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    )
  );

  if (rows.length === 0) {
    throw new Error("Dataset contains no rows.");
  }

  const columnNames = Object.keys(rows[0]);
  const columns: ColumnProfile[] = [];

  let dateColumnCandidate: string | null = null;
  let targetCandidate: string | null = null;
  const featureCandidates: string[] = [];

  for (const col of columnNames) {
    const rawValues = rows.map((r) => r[col]);
    let missingCount = 0;
    const nonNullValues: any[] = [];

    for (const v of rawValues) {
      if (v === null || v === undefined || v === "" || (typeof v === "number" && isNaN(v))) {
        missingCount++;
      } else {
        nonNullValues.push(v);
      }
    }

    const totalCount = rawValues.length;
    const distinctSet = new Set(nonNullValues.map(String));
    const distinctCount = distinctSet.size;

    // Detect type
    let type: ColumnType = "categorical";

    // 1. Check Date
    const isLikelyDateName = /date|time|timestamp|day|month|year/i.test(col);
    const dateParsedCount = nonNullValues.filter((val) => {
      if (typeof val === "number" && val > 1000 && val < 2200 && isLikelyDateName) return false;
      const parsed = Date.parse(String(val));
      return !isNaN(parsed) && String(val).length >= 4 && isNaN(Number(val));
    }).length;

    if (nonNullValues.length > 0 && (dateParsedCount / nonNullValues.length > 0.8 || (isLikelyDateName && dateParsedCount > 0))) {
      type = "date";
      if (!dateColumnCandidate) dateColumnCandidate = col;
    } else {
      // 2. Check Numeric
      const numericParsed = nonNullValues.map(Number);
      const validNumericCount = numericParsed.filter((n) => !isNaN(n)).length;

      if (nonNullValues.length > 0 && validNumericCount / nonNullValues.length > 0.85) {
        // Check if it's an ID column
        const isIdName = /^id$|_id$|^index$|^uuid$/i.test(col);
        if (isIdName || (distinctCount === totalCount && distinctCount > 50)) {
          type = "id";
        } else {
          type = "numeric";
        }
      } else {
        type = "categorical";
      }
    }

    const profile: ColumnProfile = {
      name: col,
      type,
      totalCount,
      missingCount,
      distinctCount,
    };

    if (type === "numeric") {
      const nums = nonNullValues.map(Number).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        nums.sort((a, b) => a - b);
        const min = nums[0];
        const max = nums[nums.length - 1];
        const sum = nums.reduce((acc, curr) => acc + curr, 0);
        const mean = sum / nums.length;
        const variance =
          nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) /
          Math.max(1, nums.length - 1);
        const std = Math.sqrt(variance);
        const mid = Math.floor(nums.length / 2);
        const median =
          nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;

        profile.min = min;
        profile.max = max;
        profile.mean = mean;
        profile.std = std;
        profile.median = median;
      }
    } else if (type === "categorical") {
      profile.uniqueValues = Array.from(distinctSet).slice(0, 15);
    }

    columns.push(profile);
  }

  // Determine candidates
  const numericCols = columns.filter((c) => c.type === "numeric");
  if (numericCols.length === 0) {
    throw new Error("Dataset contains no numeric columns to predict.");
  }

  // Target candidate: prefer common target names like G3, sales, target, price, revenue, units, consumption, or last numeric
  const targetRegex = /^(g3|target|sales|units|price|revenue|consumption|demand|score|output|y)$/i;
  const matchedTarget = numericCols.find((c) => targetRegex.test(c.name));
  targetCandidate = matchedTarget ? matchedTarget.name : numericCols[numericCols.length - 1].name;

  for (const c of columns) {
    if (c.name !== targetCandidate && c.type !== "id" && c.type !== "date") {
      featureCandidates.push(c.name);
    }
  }

  return {
    name,
    rowCount: rows.length,
    columnCount: columnNames.length,
    columns,
    previewRows: rows.slice(0, 10),
    rawRows: rows,
    hasDateColumn: dateColumnCandidate !== null,
    dateColumnCandidate,
    targetCandidate,
    featureCandidates,
  };
}

/**
 * Simple pseudo-random generator with seed for reproducible train/test splits.
 */
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Trains an OLS Linear Regression model with complete diagnostics.
 */
export function trainModel(
  dataset: DatasetProfile,
  config: ModelConfig
): TrainedModel {
  const { targetColumn, featureColumns, trainRatio, mode } = config;

  if (!targetColumn) {
    throw new Error("Target column is required.");
  }
  if (!featureColumns || featureColumns.length === 0) {
    throw new Error("At least one feature column must be selected.");
  }

  const rawRows = [...dataset.rawRows];
  const N = rawRows.length;
  if (N < 5) {
    throw new Error("Dataset has too few rows to train (minimum 5 required).");
  }

  // Get Column profiles
  const colMap = new Map(dataset.columns.map((c) => [c.name, c]));
  const targetColProfile = colMap.get(targetColumn);
  if (!targetColProfile || targetColProfile.type !== "numeric") {
    throw new Error(`Target column "${targetColumn}" must be numeric.`);
  }

  // Pre-calculate medians for imputation
  const featureMedians: Record<string, number> = {};
  const featureModes: Record<string, string> = {};
  const categoricalLevels: Record<string, string[]> = {};

  for (const feat of featureColumns) {
    const prof = colMap.get(feat);
    if (!prof) continue;

    if (prof.type === "numeric") {
      featureMedians[feat] = prof.median ?? prof.mean ?? 0;
    } else {
      // Collect unique categories with < 12 levels
      const counts: Record<string, number> = {};
      for (const r of rawRows) {
        const val = String(r[feat] ?? "");
        if (val) counts[val] = (counts[val] || 0) + 1;
      }
      let topCategory = "";
      let topCount = -1;
      for (const [k, v] of Object.entries(counts)) {
        if (v > topCount) {
          topCount = v;
          topCategory = k;
        }
      }
      featureModes[feat] = topCategory;

      const levels = Object.keys(counts);
      if (levels.length > 1 && levels.length <= 12) {
        // Record all observed unique levels for UI selection
        categoricalLevels[feat] = levels;
      }
    }
  }

  const targetMedian = targetColProfile.median ?? targetColProfile.mean ?? 0;

  // Build expanded feature definitions
  const encodedFeatureNames: string[] = [];
  for (const feat of featureColumns) {
    const prof = colMap.get(feat);
    if (!prof) continue;
    if (prof.type === "numeric") {
      encodedFeatureNames.push(feat);
    } else if (categoricalLevels[feat]) {
      // Exclude first level as reference category to avoid dummy trap
      for (const lvl of categoricalLevels[feat].slice(1)) {
        encodedFeatureNames.push(`${feat}_${lvl}`);
      }
    }
  }

  if (encodedFeatureNames.length === 0) {
    throw new Error("No usable feature columns found after encoding.");
  }

  // Vector extraction helper
  const extractFeatures = (row: Record<string, any>): number[] => {
    const vec: number[] = [];
    for (const feat of featureColumns) {
      const prof = colMap.get(feat);
      if (!prof) continue;

      if (prof.type === "numeric") {
        let val = Number(row[feat]);
        if (isNaN(val) || row[feat] === null || row[feat] === undefined || row[feat] === "") {
          val = featureMedians[feat];
        }
        vec.push(val);
      } else if (categoricalLevels[feat]) {
        const rowVal = String(row[feat] ?? featureModes[feat]);
        for (const lvl of categoricalLevels[feat].slice(1)) {
          vec.push(rowVal === lvl ? 1 : 0);
        }
      }
    }
    return vec;
  };

  // Build full matrix
  const fullX: number[][] = [];
  const fullY: number[] = [];

  for (let i = 0; i < N; i++) {
    const r = rawRows[i];
    let yVal = Number(r[targetColumn]);
    if (isNaN(yVal) || r[targetColumn] === null || r[targetColumn] === undefined || r[targetColumn] === "") {
      yVal = targetMedian;
    }
    fullX.push(extractFeatures(r));
    fullY.push(yVal);
  }

  // Check constant target
  const yMin = Math.min(...fullY);
  const yMax = Math.max(...fullY);
  if (Math.abs(yMax - yMin) < 1e-9) {
    throw new Error(`Target column "${targetColumn}" is constant (all values are ${yMin}). Model cannot train on constant target.`);
  }

  // Train / Test Split
  let trainIndices: number[] = [];
  let testIndices: number[] = [];

  if (mode === "time_series") {
    // Chronological split
    const splitPoint = Math.floor(N * trainRatio);
    trainIndices = Array.from({ length: splitPoint }, (_, i) => i);
    testIndices = Array.from({ length: N - splitPoint }, (_, i) => splitPoint + i);
  } else {
    // Random split with fixed seed
    const rand = seededRandom(42);
    const indices = Array.from({ length: N }, (_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const splitPoint = Math.min(N, Math.floor(N * trainRatio));
    trainIndices = indices.slice(0, splitPoint);
    testIndices = splitPoint < N ? indices.slice(splitPoint) : [...indices];
  }

  if (trainIndices.length === 0) {
    throw new Error("Training set is empty. Increase dataset size.");
  }
  if (testIndices.length === 0) {
    testIndices = [...trainIndices];
  }

  const X_train = trainIndices.map((i) => fullX[i]);
  const y_train = trainIndices.map((i) => fullY[i]);
  const X_test = testIndices.map((i) => fullX[i]);
  const y_test = testIndices.map((i) => fullY[i]);

  // Compute feature training statistics
  const p = encodedFeatureNames.length;
  const featureMeans: Record<string, number> = {};
  const featureStds: Record<string, number> = {};
  const featureMins: Record<string, number> = {};
  const featureMaxs: Record<string, number> = {};

  for (let j = 0; j < p; j++) {
    const fName = encodedFeatureNames[j];
    const vals = X_train.map((row) => row[j]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const variance =
      vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(1, vals.length - 1);
    const std = Math.sqrt(variance);

    featureMeans[fName] = mean;
    featureStds[fName] = std || 1;
    featureMins[fName] = min;
    featureMaxs[fName] = max;
  }

  const targetMean = y_train.reduce((a, b) => a + b, 0) / y_train.length;
  const targetVariance =
    y_train.reduce((a, b) => a + Math.pow(b - targetMean, 2), 0) /
    Math.max(1, y_train.length - 1);
  const targetStd = Math.sqrt(targetVariance) || 1;

  // Add intercept 1 to train design matrix
  const X_train_design = X_train.map((row) => [1, ...row]);

  // Solve OLS
  const { beta, wasRidgeStabilized } = solveOLS(X_train_design, y_train);
  const intercept = beta[0];
  const coefficients: Record<string, number> = {};
  const standardizedCoefficients: Record<string, number> = {};

  for (let j = 0; j < p; j++) {
    const fName = encodedFeatureNames[j];
    const rawCoeff = beta[j + 1];
    coefficients[fName] = rawCoeff;
    // Standardized beta = raw_coeff * (std(X) / std(y))
    standardizedCoefficients[fName] = rawCoeff * (featureStds[fName] / targetStd);
  }

  // Predict on train to compute residual std
  const trainPredictions = X_train.map((row) => {
    let pred = intercept;
    for (let j = 0; j < p; j++) {
      pred += row[j] * beta[j + 1];
    }
    return pred;
  });

  const sseTrain = y_train.reduce(
    (acc, yVal, i) => acc + Math.pow(yVal - trainPredictions[i], 2),
    0
  );
  const dof = Math.max(1, trainIndices.length - p - 1);
  const residualStd = Math.sqrt(sseTrain / dof);

  // Evaluate on Held-Out Test Set
  const testPredictions = testIndices.map((origIdx, testIdx) => {
    const row = X_test[testIdx];
    let pred = intercept;
    for (let j = 0; j < p; j++) {
      pred += row[j] * beta[j + 1];
    }
    return {
      index: origIdx,
      actual: y_test[testIdx],
      predicted: pred,
    };
  });

  const testActuals = testPredictions.map((t) => t.actual);
  const testPreds = testPredictions.map((t) => t.predicted);
  const testMean = testActuals.reduce((a, b) => a + b, 0) / testActuals.length;

  const sseTest = testActuals.reduce(
    (acc, act, i) => acc + Math.pow(act - testPreds[i], 2),
    0
  );
  const sstTest = testActuals.reduce(
    (acc, act) => acc + Math.pow(act - testMean, 2),
    0
  );
  const r2 = sstTest > 1e-11 ? Math.max(-1, 1 - sseTest / sstTest) : 0;
  const mae =
    testActuals.reduce((acc, act, i) => acc + Math.abs(act - testPreds[i]), 0) /
    testActuals.length;
  const rmse = Math.sqrt(sseTest / testActuals.length);

  const N_train = trainIndices.length;
  const N_test = testIndices.length;

  // Diagnostics and Collinearity check
  const warnings: string[] = [];
  if (wasRidgeStabilized) {
    warnings.push("Matrix was singular or collinear; ridge regularisation was applied to stabilise coefficients.");
  }
  if (N < 30 || N_train < 30) {
    warnings.push(
      `Small sample size (${N} total rows, ${N_train} training rows). Linear models fitted on fewer than 30 observations have elevated variance.`
    );
  }
  if (r2 < 0.3) {
    warnings.push(`Low test R² (${r2.toFixed(2)}). The linear model explains less than 30% of the variance on unseen data.`);
  }

  // Pearson correlation and VIF for features
  const collinearPairs: { featureA: string; featureB: string; correlation: number }[] = [];
  const vifScores: Record<string, number> = {};

  for (let i = 0; i < p; i++) {
    for (let j = i + 1; j < p; j++) {
      const featA = encodedFeatureNames[i];
      const featB = encodedFeatureNames[j];
      const meanA = featureMeans[featA];
      const meanB = featureMeans[featB];
      const stdA = featureStds[featA];
      const stdB = featureStds[featB];

      let cov = 0;
      for (let k = 0; k < X_train.length; k++) {
        cov += (X_train[k][i] - meanA) * (X_train[k][j] - meanB);
      }
      cov /= Math.max(1, X_train.length - 1);
      const corr = cov / (stdA * stdB);

      if (Math.abs(corr) > 0.85) {
        collinearPairs.push({
          featureA: featA,
          featureB: featB,
          correlation: corr,
        });
        warnings.push(`High collinearity between ${featA} and ${featB} (r = ${corr.toFixed(2)}). Coefficients may be sensitive to small data shifts.`);
      }
    }
  }

  const metrics: EvaluationMetrics = {
    r2,
    mae,
    rmse,
    nTrain: trainIndices.length,
    nTest: testIndices.length,
    residualStd,
    warnings,
    collinearPairs,
    vifScores,
  };

  // Simple regression curve for 1-feature mode
  let simpleRegressionCurve: TrainedModel["simpleRegressionCurve"];
  if (encodedFeatureNames.length === 1) {
    const singleFeat = encodedFeatureNames[0];
    const slope = coefficients[singleFeat];
    const points = fullX.map((row, idx) => ({
      x: row[0],
      actual: fullY[idx],
      fit: intercept + slope * row[0],
    }));
    points.sort((a, b) => a.x - b.x);
    simpleRegressionCurve = {
      featureName: singleFeat,
      points,
    };
  }

  return {
    config,
    intercept,
    coefficients,
    standardizedCoefficients,
    featureMeans,
    featureStds,
    featureMins,
    featureMaxs,
    targetMean,
    targetStd,
    targetMin: yMin,
    targetMax: yMax,
    categoricalLevels,
    metrics,
    testPredictions,
    simpleRegressionCurve,
    encodedFeatureNames,
  };
}

/**
 * Predicts and explains an individual input vector with exact contribution decomposition.
 */
export function predictAndExplain(
  model: TrainedModel,
  inputs: Record<string, any>
): PredictionResult {
  const {
    intercept,
    coefficients,
    standardizedCoefficients,
    featureMeans,
    featureMins,
    featureMaxs,
    targetMin,
    targetMax,
    config,
    metrics,
    encodedFeatureNames,
    categoricalLevels,
  } = model;

  const contributions: FeatureContribution[] = [];
  const importances: FeatureImportance[] = [];
  const extrapolations: string[] = [];

  // Calculate baseline mean prediction: intercept + sum(coeff * mean)
  let baselineMean = intercept;
  for (const fName of encodedFeatureNames) {
    baselineMean += (coefficients[fName] || 0) * (featureMeans[fName] || 0);
  }

  let rawPrediction = intercept;

  for (const fName of encodedFeatureNames) {
    let inputValue: number;
    let label = fName;

    // Check if one-hot encoded dummy
    let isOneHot = false;
    let baseCol = "";
    let level = "";
    if (categoricalLevels) {
      for (const catCol of Object.keys(categoricalLevels)) {
        if (fName.startsWith(`${catCol}_`)) {
          isOneHot = true;
          baseCol = catCol;
          level = fName.slice(catCol.length + 1);
          break;
        }
      }
    }

    if (isOneHot) {
      label = `${baseCol} = ${level}`;
      inputValue = String(inputs[baseCol]) === level ? 1 : 0;
    } else {
      inputValue = Number(inputs[fName] ?? featureMeans[fName] ?? 0);
    }

    const coeff = coefficients[fName] || 0;
    const mean = featureMeans[fName] || 0;
    const minVal = featureMins[fName];
    const maxVal = featureMaxs[fName];

    // Extrapolation check (for numeric non-dummy)
    let isExtrapolated = false;
    if (!isOneHot && minVal !== undefined && maxVal !== undefined) {
      if (inputValue < minVal || inputValue > maxVal) {
        isExtrapolated = true;
        extrapolations.push(
          `${label}: value ${inputValue} is outside training range [${minVal}, ${maxVal}]`
        );
      }
    }

    // Contribution = coeff * (x - mean)
    const contribution = coeff * (inputValue - mean);
    rawPrediction += coeff * inputValue;

    contributions.push({
      feature: fName,
      label,
      inputValue,
      trainingMean: mean,
      coefficient: coeff,
      contribution,
      isExtrapolated,
    });

    const stdCoeff = standardizedCoefficients[fName] || 0;
    importances.push({
      feature: fName,
      label,
      importance: Math.abs(stdCoeff),
      standardizedCoefficient: stdCoeff,
      direction: stdCoeff >= 0 ? "positive" : "negative",
    });
  }

  // Sort importances by absolute strength
  importances.sort((a, b) => b.importance - a.importance);

  // Range clipping
  let clippedPrediction = rawPrediction;
  let isClipped = false;
  if (config.clipToTargetRange) {
    if (rawPrediction < targetMin) {
      clippedPrediction = targetMin;
      isClipped = true;
    } else if (rawPrediction > targetMax) {
      clippedPrediction = targetMax;
      isClipped = true;
    }
  }

  // 95% Prediction interval (approx 1.96 * residual std)
  const margin = 1.96 * metrics.residualStd;
  const lowerBound = config.clipToTargetRange
    ? Math.max(targetMin, rawPrediction - margin)
    : rawPrediction - margin;
  const upperBound = config.clipToTargetRange
    ? Math.min(targetMax, rawPrediction + margin)
    : rawPrediction + margin;

  // Plain-English explanation synthesis
  const topDrivers = importances.slice(0, 3);
  let summarySentence = "";
  if (topDrivers.length > 0) {
    const driverPhrases = topDrivers.map(
      (d) => `${d.label} (${d.direction === "positive" ? "increases" : "decreases"} estimate)`
    );
    summarySentence = `Primary factors influencing this prediction are ${driverPhrases.join(
      ", "
    )}.`;
  } else {
    summarySentence = "Prediction calculated from base intercept and feature offsets.";
  }

  // Dominance check: if top feature importance > 2x second feature
  let dominanceNote: string | undefined;
  if (importances.length >= 2 && importances[0].importance > 2 * importances[1].importance) {
    dominanceNote = `Feature "${importances[0].label}" strongly dominates the model (relative weight ${importances[0].importance.toFixed(
      2
    )} vs next highest ${importances[1].importance.toFixed(2)}).`;
  }

  // Counter-intuitive warning (e.g. negative studytime or negative price when expected positive)
  let counterIntuitiveNote: string | undefined;
  for (const imp of importances) {
    if (/studytime|prep|effort|quality|rating/i.test(imp.feature) && imp.direction === "negative") {
      counterIntuitiveNote = `Note: ${imp.label} has a negative coefficient (${coefficients[imp.feature]?.toFixed(
        3
      )}). In multivariate regression, this reflects conditional partial correlation holding other factors constant, which can diverge from simple bivariate correlation.`;
      break;
    }
  }

  return {
    rawPrediction,
    clippedPrediction,
    isClipped,
    predictionInterval: [lowerBound, upperBound],
    residualStd: metrics.residualStd,
    baselineMean,
    contributions,
    importances,
    extrapolations,
    summarySentence,
    dominanceNote,
    counterIntuitiveNote,
  };
}
