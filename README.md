# Future Predictor

A fast, client-side web application for tabular regression, factor explainability, and time-series forecasting. Upload any tabular CSV file or pick a bundled sample dataset, choose your prediction target, and train an ordinary least squares (OLS) regression model directly in your browser with zero server roundtrips.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Bklit UI** chart primitives.

---

## Key Features

1. **Client-Side Privacy and Speed**:
   - 100% in-browser computation using custom linear algebra solvers.
   - Zero telemetry, zero external model APIs, and zero data leaves your local machine.

2. **Automated Schema Profiling**:
   - Detects column types (`numeric`, `categorical`, `date`, `id`).
   - Summary statistics: min, max, mean, standard deviation, and median.
   - Missing-value counting with automatic median imputation for numeric features and mode imputation for categorical features.
   - One-hot encoding for categoricals with 12 or fewer distinct levels (dropping the baseline category to eliminate multicollinearity).

3. **Generalised OLS Engine with Ridge Fallback**:
   - Closed-form normal equations solver: $\beta = (X^T X)^{-1} X^T y$.
   - Automatic L2 Ridge regularisation fallback ($\lambda = 10^{-4}$) if $X^T X$ is singular or near-collinear.
   - Internal z-score standardisation for stable unit-free feature importance ranking.

4. **Honest Model Evaluation**:
   - 80/20 train/test split (randomized with fixed seed for tabular data; strictly chronological for time series).
   - Validation metrics on unseen held-out test data: $R^2$, MAE, RMSE, and Residual Standard Error ($s_e$).
   - Statistical integrity alerts for small datasets ($N < 30$), low fit ($R^2 < 0.30$), and high collinearity (Pearson $|r| > 0.85$ or VIF $> 5.0$).

5. **Interactive Prediction and Extrapolation Flags**:
   - Reactive sliders for numeric inputs and clean select dropdowns for categorical factors.
   - Target range clipping toggle (e.g. 0 to 20 student grade scale).
   - 95% prediction interval: $[\hat{y} - 1.96 s_e, \hat{y} + 1.96 s_e]$.
   - Visual warnings when an input exceeds the observed training domain.

6. **Exact Waterfall Factor Attribution**:
   - Exact decomposition: $\text{Contribution}_j = \beta_j (x_j - \bar{x}_j)$.
   - Baseline mean: $\bar{y}_{\text{baseline}} = \beta_0 + \sum_j \beta_j \bar{x}_j$.
   - Sum of contributions plus baseline equals the predicted value with zero approximation error.
   - Plain-English executive summary highlighting top drivers and directional impact.
   - Transparent correlation vs causation notices.

7. **Time-Series Forecaster**:
   - Automated temporal feature extraction: linear trend, lag-1, lag-7, day-of-week sine/cosine seasonality, and annual harmonic curves.
   - Recursive autoregressive multi-step rollout for future horizons.
   - Expanding uncertainty confidence intervals for forward projections.

8. **Bklit UI Chart Integration**:
   - **ComposedChart / LineChart**: Historical observations, dashed future projection line, and shaded confidence intervals.
   - **ScatterChart & Cartesian Fit**: Held-out actual vs predicted calibration plot with ideal 45-degree diagonal.
   - **BarChart**: Signed factor contribution waterfall and standardised feature importance ranking.
   - **Gauge**: Visual $R^2$ model confidence meter.

---

## Quick Start

### Prerequisites
- Node.js 18+ or Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone or navigate to the repository
cd "future predictor"

# Install project dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Available Scripts

- `npm run dev`: Starts local Vite development server with hot module replacement.
- `npm run build`: Generates optimized production build in `dist/`.
- `npm run preview`: Serves production build locally.
- `npm test`: Runs Vitest unit test suite covering matrix math, student benchmark verification, CSV edge cases, and time-series forecasting.
- `npm run check-types`: Runs TypeScript type checking (`tsc --noEmit`).

---

## Bundled Sample Datasets

The application includes four bundled sample datasets with pre-configured verification scenarios:

1. **Student Academic Performance (`student_clean_model.csv`)**:
   - Reference dataset matching the logic from `Future_predictor.ipynb`.
   - Target: `G3` (final exam mark).
   - Features: `studytime`, `failures`, `absences`, `G1`.
   - Verification benchmark: `predict(studytime=3, failures=0, absences=2, G1=14) ≈ 14.08` with coefficients matching the reference scikit-learn notebook (`G1: 0.872`, `studytime: -0.024`, `absences: -0.042`, `failures: -0.069`, `intercept: 2.028`).

2. **Retail Product Sales (`sales_dataset.csv`)**:
   - Multivariate regression with mixed numerical and categorical variables.
   - Target: `units_sold`.
   - Features: `price`, `ad_spend`, `season` (Summer, Spring, Winter, Autumn), and `store_traffic`.
   - Demonstrates one-hot dummy encoding, factor dominance detection, and price elasticity.

3. **Daily Electricity Consumption (`electricity_consumption.csv`)**:
   - Time-series dataset with 180 daily records.
   - Target: `consumption_kwh`.
   - Date column: `date`.
   - Additional exogenous regressor: `temperature_c`.
   - Demonstrates 30-day ahead recursive forecasting with dashed trajectory lines and expanding confidence intervals.

4. **Edge Case & Messy Catalog (`messy_dataset.csv`)**:
   - Diagnostic dataset with embedded quotes, quoted commas, null columns, missing entries, and small sample size ($N = 35$).
   - Demonstrates resilient PapaParse ingestion, median imputation, ID column detection, and sample adequacy warnings.

---

## Bklit UI Component Mapping

All charts leverage MIT-licensed components from `@bklit/ui` cloned locally in `bklit-ui/`:

| Visualization | Bklit Components Used | Purpose |
| :--- | :--- | :--- |
| **Model Confidence** | `<Gauge />` | Visualizes held-out test $R^2$ score and goodness of fit |
| **Factor Contributions** | `<BarChart />`, `<Bar />`, `<Grid />`, `<XAxis />`, `<YAxis />`, `<ChartTooltip />` | Decomposes individual prediction into positive and negative factor bars |
| **Feature Importance** | `<BarChart />`, `<Bar />`, `<Grid />`, `<XAxis />`, `<YAxis />`, `<ChartTooltip />` | Standardized beta coefficient rankings across the entire dataset |
| **Time-Series Projection** | `<ComposedChart />`, `<Line />`, `<Area />`, `<Grid />`, `<XAxis />`, `<YAxis />`, `<ChartTooltip />` | Renders history, dashed future forecast tail, and shaded 95% confidence interval band |
| **Model Calibration** | `<ScatterChart />`, `<Scatter />`, `<Grid />`, `<XAxis />`, `<YAxis />`, `<ChartTooltip />` | Held-out actual vs predicted points against the ideal 45-degree reference line |

---

## Model Limitations and Methodological Constraints

Linear regression is transparent and interpretable, but real-world datasets present inherent limitations:

### 1. Linearity Assumption
OLS assumes that the relationship between features and the target variable is additive and linear:
$$y = \beta_0 + \beta_1 x_1 + \dots + \beta_p x_p + \varepsilon$$
Non-linear effects (such as diminishing returns, exponential growth, or threshold cliffs) cannot be captured without explicit feature transformations.

### 2. Correlation vs Causation
Coefficients represent observed statistical associations holding other included variables constant (conditional partial correlations). They do not indicate causal mechanisms. Modifying an input variable in the real world will not necessarily produce the predicted change if unmeasured confounders, selection biases, or reverse causality exist.

### 3. Multicollinearity Sensitivity
When two or more predictor variables are strongly correlated (e.g. Pearson $|r| > 0.85$ or VIF $> 5.0$), the matrix $X^T X$ becomes ill-conditioned. While our ridge fallback stabilizes coefficient computation, individual coefficient estimates can exhibit elevated variance or counter-intuitive signs.

### 4. Extrapolation Hazards
Predictions made outside the range of observed training data ($\min(x_j) \le x_j \le \max(x_j)$) rely on unverified assumptions about the persistence of linear relationships. The application flags out-of-bounds inputs to warn users of extrapolation risk.

### 5. Outlier and Leverage Sensitivity
OLS minimizes squared residuals ($\sum e_i^2$), making parameter estimates sensitive to extreme outliers and high-leverage data points. Reviewing the preview table and checking residual plots is recommended for skewed distributions.

### 6. Time-Series Regime Shifts
Autoregressive linear time-series models assume stationarity and stable seasonality patterns. Unforeseen structural breaks, policy shifts, or black-swan events cannot be predicted from historical series alone.

---

## License

MIT License.
