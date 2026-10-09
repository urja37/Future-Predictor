import fs from "node:fs";

const studentCsv = fs.readFileSync("student_clean_model.csv", "utf8");
const salesCsv = fs.readFileSync("public/samples/sales_dataset.csv", "utf8");
const elecCsv = fs.readFileSync("public/samples/electricity_consumption.csv", "utf8");
const messyCsv = fs.readFileSync("public/samples/messy_dataset.csv", "utf8");

const content = `// Bundled sample datasets for Future Predictor

export interface SampleDataset {
  id: string;
  title: string;
  description: string;
  filename: string;
  targetCol: string;
  featureCols: string[];
  dateCol?: string;
  mode: "simple" | "multiple" | "time_series";
  clipRange?: boolean;
  demoPredictions: {
    label: string;
    inputs: Record<string, any>;
    expectedNote?: string;
  }[];
  csvContent: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "student-marks",
    title: "Student Academic Performance",
    description: "Predict student final exam grade (G3) from study habits, past failures, absences, and first period grade (G1).",
    filename: "student_clean_model.csv",
    targetCol: "G3",
    featureCols: ["studytime", "failures", "absences", "G1"],
    mode: "multiple",
    clipRange: true,
    demoPredictions: [
      {
        label: "Benchmark Student (Notebook Test)",
        inputs: { studytime: 3, failures: 0, absences: 2, G1: 14 },
        expectedNote: "Notebook test verification: predicts ~14.08 / 20"
      },
      {
        label: "High Achiever",
        inputs: { studytime: 4, failures: 0, absences: 0, G1: 18 },
        expectedNote: "High first period grade with zero failures"
      },
      {
        label: "At-Risk Student",
        inputs: { studytime: 1, failures: 2, absences: 16, G1: 6 },
        expectedNote: "Low study time, repeated failures, high absences"
      }
    ],
    csvContent: ${JSON.stringify(studentCsv)}
  },
  {
    id: "retail-sales",
    title: "Retail Product Sales",
    description: "Multivariate regression predicting store unit sales based on pricing, marketing ad spend, season, and foot traffic.",
    filename: "sales_dataset.csv",
    targetCol: "units_sold",
    featureCols: ["price", "ad_spend", "season", "store_traffic"],
    mode: "multiple",
    clipRange: true,
    demoPredictions: [
      {
        label: "Mid-Season Baseline Store",
        inputs: { price: 24.99, ad_spend: 2500, season: "Autumn", store_traffic: 900 },
        expectedNote: "Balanced retail baseline"
      },
      {
        label: "Holiday Winter Campaign",
        inputs: { price: 29.99, ad_spend: 4800, season: "Winter", store_traffic: 1650 },
        expectedNote: "High marketing push during peak holiday shopping"
      },
      {
        label: "Budget Clearance",
        inputs: { price: 16.50, ad_spend: 600, season: "Spring", store_traffic: 350 },
        expectedNote: "Discounted pricing with low ad investment"
      }
    ],
    csvContent: ${JSON.stringify(salesCsv)}
  },
  {
    id: "electricity-demand",
    title: "Daily Electricity Consumption",
    description: "Time-series daily energy load featuring trend, day-of-week seasonality, temperature fluctuations, and a 30-day forecast.",
    filename: "electricity_consumption.csv",
    targetCol: "consumption_kwh",
    featureCols: ["temperature_c", "is_weekend", "peak_hours"],
    dateCol: "date",
    mode: "time_series",
    clipRange: false,
    demoPredictions: [
      {
        label: "Hot Summer Weekday",
        inputs: { temperature_c: 28.5, is_weekend: 0, peak_hours: 10 },
        expectedNote: "Elevated AC cooling demand during business hours"
      },
      {
        label: "Mild Weekend Day",
        inputs: { temperature_c: 19.0, is_weekend: 1, peak_hours: 6 },
        expectedNote: "Lower commercial load with moderate climate"
      },
      {
        label: "Cold Winter Workday",
        inputs: { temperature_c: 3.5, is_weekend: 0, peak_hours: 10 },
        expectedNote: "High heating load during peak industrial usage"
      }
    ],
    csvContent: ${JSON.stringify(elecCsv)}
  },
  {
    id: "messy-ecommerce",
    title: "Edge Case & Messy Catalog",
    description: "Diagnostic dataset with quoted commas, missing values, empty columns, and mixed types to verify parsing resilience.",
    filename: "messy_dataset.csv",
    targetCol: "total_sales",
    featureCols: ["rating", "reviews_count", "unit_price"],
    mode: "multiple",
    clipRange: true,
    demoPredictions: [
      {
        label: "High-Volume Accessory",
        inputs: { rating: 4.8, reviews_count: 350, unit_price: 19.99 },
        expectedNote: "Popular high-rating SKU"
      },
      {
        label: "Premium Office Item",
        inputs: { rating: 4.5, reviews_count: 80, unit_price: 79.00 },
        expectedNote: "Higher price point with moderate reviews"
      },
      {
        label: "New Product Listing",
        inputs: { rating: 4.0, reviews_count: 15, unit_price: 12.50 },
        expectedNote: "Limited social proof"
      }
    ],
    csvContent: ${JSON.stringify(messyCsv)}
  }
];
`;

fs.writeFileSync("src/data/samples.ts", content);
console.log("src/data/samples.ts generated successfully.");
