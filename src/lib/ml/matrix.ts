/**
 * Matrix operations with closed-form inversion and Ridge fallback.
 */

export function transpose(A: number[][]): number[][] {
  if (A.length === 0 || A[0].length === 0) return [];
  const rows = A.length;
  const cols = A[0].length;
  const AT: number[][] = Array.from({ length: cols }, () => new Array(rows));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      AT[c][r] = A[r][c];
    }
  }
  return AT;
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Matrix dimensions mismatch: ${colsA} !== ${rowsB}`);
  }

  const result: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const a_ik = A[i][k];
      if (a_ik === 0) continue;
      for (let j = 0; j < colsB; j++) {
        result[i][j] += a_ik * B[k][j];
      }
    }
  }
  return result;
}

/**
 * Inverts a square matrix using Gauss-Jordan elimination with partial pivoting.
 * If singular or near-singular (pivot < 1e-11), applies Ridge stabilization (adds lambda * I).
 */
export function invertMatrix(A: number[][], ridgeLambda = 1e-4): { inv: number[][]; wasStabilized: boolean } {
  const n = A.length;
  let wasStabilized = false;

  const tryInvert = (matrix: number[][]): number[][] | null => {
    // Augmented matrix [A | I]
    const M: number[][] = matrix.map((row, i) => [
      ...row,
      ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    ]);

    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      let maxVal = Math.abs(M[i][i]);
      for (let k = i + 1; k < n; k++) {
        const val = Math.abs(M[k][i]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = k;
        }
      }

      if (maxVal < 1e-11) {
        return null; // Singular or rank-deficient
      }

      // Swap rows
      if (maxRow !== i) {
        const temp = M[i];
        M[i] = M[maxRow];
        M[maxRow] = temp;
      }

      // Normalize pivot row
      const pivot = M[i][i];
      for (let j = 0; j < 2 * n; j++) {
        M[i][j] /= pivot;
      }

      // Eliminate other rows
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = M[k][i];
          if (factor !== 0) {
            for (let j = 0; j < 2 * n; j++) {
              M[k][j] -= factor * M[i][j];
            }
          }
        }
      }
    }

    return M.map((row) => row.slice(n));
  };

  let inv = tryInvert(A);
  if (!inv) {
    wasStabilized = true;
    // Add ridge lambda to diagonal (except optionally intercept at index 0)
    const stabilized = A.map((row, i) =>
      row.map((val, j) => (i === j ? val + (i === 0 ? 1e-9 : ridgeLambda) : val))
    );
    inv = tryInvert(stabilized);
    if (!inv) {
      // Stronger fallback if still singular
      const heavyStabilized = A.map((row, i) =>
        row.map((val, j) => (i === j ? val + 1e-2 : val))
      );
      inv = tryInvert(heavyStabilized);
      if (!inv) {
        throw new Error("Matrix is completely non-invertible even with ridge regularisation.");
      }
    }
  }

  return { inv, wasStabilized };
}

/**
 * Solves OLS normal equation: (X^T * X) * beta = X^T * y
 * X is design matrix including intercept column of 1s (N x (p + 1)).
 */
export function solveOLS(
  X: number[][],
  y: number[]
): {
  beta: number[];
  wasRidgeStabilized: boolean;
  xtxInv: number[][];
} {
  const N = X.length;
  if (N === 0) throw new Error("Empty design matrix");
  const pPlus1 = X[0].length;

  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const { inv: XtX_inv, wasStabilized } = invertMatrix(XtX);

  const yCol = y.map((val) => [val]);
  const Xty = matMul(Xt, yCol);
  const betaCol = matMul(XtX_inv, Xty);
  const beta = betaCol.map((r) => r[0]);

  return {
    beta,
    wasRidgeStabilized: wasStabilized,
    xtxInv: XtX_inv,
  };
}
