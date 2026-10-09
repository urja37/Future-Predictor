import fs from "node:fs";
import path from "node:path";

function seeded(s) {
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 1. Sales Dataset (150 rows)
const randSales = seeded(12345);
const seasons = ["Spring", "Summer", "Autumn", "Winter"];
const salesRows = ["price,ad_spend,season,store_traffic,units_sold"];

for (let i = 0; i < 150; i++) {
  const price = +(15 + randSales() * 30).toFixed(2);
  const ad_spend = Math.round(500 + randSales() * 4500);
  const season = seasons[Math.floor(randSales() * 4)];
  const store_traffic = Math.round(200 + randSales() * 1600);
  const seasonBoost =
    season === "Winter" ? 60 : season === "Summer" ? 35 : season === "Spring" ? 20 : 10;
  const noise = (randSales() - 0.5) * 40;
  const units = Math.max(
    20,
    Math.round(400 - 6.5 * price + 0.08 * ad_spend + 0.22 * store_traffic + seasonBoost + noise)
  );
  salesRows.push([price, ad_spend, season, store_traffic, units].join(","));
}

fs.writeFileSync("public/samples/sales_dataset.csv", salesRows.join("\n"));

// 2. Electricity Dataset (180 days)
const randElec = seeded(67890);
const elecRows = ["date,temperature_c,is_weekend,peak_hours,consumption_kwh"];
const baseDate = new Date("2025-01-01");

for (let t = 0; t < 180; t++) {
  const d = new Date(baseDate.getTime() + t * 86400000);
  const dateStr = d.toISOString().split("T")[0];
  const dow = d.getDay();
  const is_weekend = dow === 0 || dow === 6 ? 1 : 0;
  const temp = +(10 + 15 * Math.sin((t / 180) * Math.PI) + (randElec() - 0.5) * 4).toFixed(1);
  const peak = is_weekend ? 6 : 10;
  const weeklyCycle = is_weekend ? -200 : 120;
  const tempHeating = temp < 15 ? (15 - temp) * 18 : 0;
  const tempCooling = temp > 22 ? (temp - 22) * 25 : 0;
  const trend = t * 1.5;
  const noise = (randElec() - 0.5) * 60;
  const kwh = Math.round(1400 + trend + weeklyCycle + tempHeating + tempCooling + noise);
  elecRows.push([dateStr, temp, is_weekend, peak, kwh].join(","));
}

fs.writeFileSync("public/samples/electricity_consumption.csv", elecRows.join("\n"));

// 3. Messy Dataset (35 rows with quotes, missing values, empty column)
const messyRows = [
  "id,product_name,category,rating,reviews_count,all_null_col,unit_price,total_sales",
  '1,"Ergonomic, Wireless Mouse",Electronics,4.5,120,,29.99,350',
  '2,"Organic ""Fair-Trade"" Coffee",Grocery,4.8,240,,14.50,480',
  "3,Basic USB-C Cable,Electronics,,85,,9.99,180",
  "4,Standing Desk Mat,Office,4.2,45,,45.00,120",
  '5,"Heavy-Duty, Steel Stapler",Office,3.9,,,18.50,95',
  "6,Ceramic Mug,Home,4.6,310,,12.00,520",
  '7,"Notebook, Dot Grid",Stationery,4.7,190,,16.00,380',
  "8,Mechanical Keyboard,Electronics,4.9,510,,89.99,940",
  "9,Desk Lamp,Home,4.1,65,,34.99,160",
  "10,Water Bottle,Fitness,4.4,140,,22.00,290",
  "11,Noise Cancelling Headphones,Electronics,4.8,420,,149.00,880",
  '12,"Plant Pot, Small",Home,4.3,95,,11.50,150',
  "13,Gel Pens 10-pack,Stationery,4.5,180,,8.99,310",
  "14,Bluetooth Speaker,Electronics,4.4,260,,49.99,530",
  "15,Yoga Mat,Fitness,4.7,310,,32.00,610",
  "16,Ballpoint Refill,Stationery,,30,,4.50,70",
  '17,"Canvas Backpack, Olive",Travel,4.6,220,,65.00,510',
  "18,Monitor Arm,Office,4.3,110,,55.00,240",
  "19,Wireless Charger,Electronics,4.0,150,,19.99,210",
  "20,Resistance Bands,Fitness,4.8,380,,15.00,720",
  "21,Paper Clips 500pk,Office,4.1,40,,5.00,60",
  "22,Stainless Steel Straws,Home,4.5,175,,9.00,270",
  "23,Travel Pillow,Travel,4.2,130,,24.00,190",
  "24,Desk Organizer,Office,4.4,90,,27.50,210",
  "25,LED Strip 5m,Home,4.3,210,,18.00,340",
  "26,Foam Roller,Fitness,4.6,160,,21.00,330",
  "27,Sticky Notes Pad,Stationery,4.5,290,,6.50,450",
  "28,Laptop Stand,Office,4.7,340,,39.99,690",
  "29,Insulated Tumbler,Home,4.6,280,,26.00,560",
  "30,Webcam HD,Electronics,4.1,190,,59.99,310",
  "31,Microfiber Cloths,Home,4.7,400,,12.00,680",
  "32,Luggage Tag,Travel,4.3,80,,7.50,110",
  "33,Highlighter Set,Stationery,4.4,150,,10.00,260",
  "34,Gaming Mousepad,Electronics,4.8,310,,19.99,620",
  "35,Correction Tape,Stationery,,25,,3.50,45",
];

fs.writeFileSync("public/samples/messy_dataset.csv", messyRows.join("\n"));
console.log("Samples generated successfully.");
