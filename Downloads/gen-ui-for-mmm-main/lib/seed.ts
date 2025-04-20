import { sql } from "@vercel/postgres";
import fs from "fs";
import csv from "csv-parser";
import path from "path";

console.log("🚀 Starting seed script...");

// ✅ Get CSV filename from command-line arguments
const csvFilename = process.argv[2];

if (!csvFilename) {
  console.error("❌ No CSV file provided. Please provide the file path.");
  process.exit(1);
}

// ✅ Extract & Sanitize Table Name from CSV
const tableName = path
  .basename(csvFilename, path.extname(csvFilename))
  .replace(/[^a-zA-Z0-9_]/g, "_") // Prevent SQL injection
  .toLowerCase();

console.log(`📂 [Step 1] Using CSV file: ${csvFilename}`);
console.log(`📌 [Step 2] Target Table Name: ${tableName}`);

async function detectColumnTypes(csvFilename: string) {
  return new Promise<{ [key: string]: string }>((resolve, reject) => {
    const sampleSize = 50; // ✅ Check first 50 rows to infer types
    let columnTypes: { [key: string]: string } = {};
    let rowCount = 0;

    fs.createReadStream(csvFilename)
      .pipe(csv())
      .on("data", (data) => {
        if (rowCount >= sampleSize) return;
        rowCount++;

        for (const [key, value] of Object.entries(data)) {
          const cleanKey = key.trim().replace(/[\uFEFF]/g, ""); // ✅ Sanitize headers
          if (!cleanKey) continue;

          if (!columnTypes[cleanKey]) {
            // Default first detected value type
            columnTypes[cleanKey] = inferType(value);
          } else {
            // If a previous type is detected, ensure consistency
            const inferredType = inferType(value);
            if (columnTypes[cleanKey] !== inferredType) {
              columnTypes[cleanKey] = "TEXT"; // Convert to TEXT if mixed types
            }
          }
        }
      })
      .on("end", () => resolve(columnTypes))
      .on("error", reject);
  });
}

// ✅ Function to Infer Column Type
function inferType(value: string): string {
  if (/^\d+$/.test(value)) return "INTEGER"; // ✅ Whole numbers
  if (/^\d+\.\d+$/.test(value)) return "FLOAT"; // ✅ Decimal numbers
  if (/^\d{2,4}-\d{1,2}-\d{1,2}$/.test(value)) return "DATE"; // ✅ YYYY-MM-DD format or YY-MM-DD
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) return "DATE"; // ✅ MM/DD/YY or MM/DD/YYYY format
  return "TEXT"; // ✅ Default to TEXT
}

async function seed(csvFilename: string) {
  console.log(`📂 [Step 3] Processing CSV file: ${csvFilename}`);

  if (!fs.existsSync(csvFilename)) {
    console.error("❌ [Step 4] CSV file not found.");
    process.exit(1);
  }

  console.log("⏳ [Step 5] Detecting column types...");
  const columnTypes = await detectColumnTypes(csvFilename);
  console.log("📌 [Step 6] Inferred Column Types:", columnTypes);

  const results: any[] = [];

  console.log("⏳ [Step 7] Reading CSV file...");
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilename)
      .pipe(csv())
      .on("data", (data) => {
        const cleanedRow: Record<string, string> = {};
        for (const key in data) {
          const cleanKey = key.trim().replace(/[\uFEFF]/g, "");
          if (!cleanKey) continue;
          cleanedRow[cleanKey] = data[key];
        }
        if (Object.keys(cleanedRow).length > 0) results.push(cleanedRow);
      })
      .on("end", () => {
        console.log("✅ [Step 8] Finished reading CSV file.");
        resolve();
      })
      .on("error", (error) => {
        console.error("❌ [Step 9] Error reading CSV file:", error);
        reject(error);
      });
  });

  if (results.length === 0) {
    console.error("❌ [Step 10] No data found in CSV!");
    process.exit(1);
  }

  console.log("⏳ [Step 11] Ensuring table exists...");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      id SERIAL PRIMARY KEY,
      ${Object.entries(columnTypes)
        .map(([col, type]) => `"${col}" ${type}`)
        .join(",\n      ")}
    );
  `;
  await sql.query(createTableQuery);
  console.log(`✅ [Step 12] Table "${tableName}" ensured.`);

  console.log("⏳ [Step 13] Inserting records into database...");
  const batchSize = 100; // ✅ Batch insert for efficiency
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    const columns = Object.keys(batch[0]).map(col => `"${col}"`).join(", ");
    const placeholders = batch
      .map(
        (_, rowIndex) =>
          `(${Object.keys(batch[0])
            .map((_, colIndex) => `$${rowIndex * Object.keys(batch[0]).length + colIndex + 1}`)
            .join(", ")})`
      )
      .join(", ");

    const values = batch.flatMap(row => Object.values(row));

    const insertQuery = `INSERT INTO "${tableName}" (${columns}) VALUES ${placeholders}`;

    try {
      await sql.query(insertQuery, values);
      console.log(`✅ [Step 14] Inserted ${batch.length} records.`);
    } catch (error) {
      console.error("❌ [Step 15] Error inserting batch:", error);
    }
  }

  console.log(`🎉 [Step 16] Successfully seeded ${results.length} records into "${tableName}".`);
}

// Run the seeding function
seed(csvFilename)
  .then(() => {
    console.log("🚀 [Final] Seeding process completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ [Final] Seeding failed:", error);
    process.exit(1);
  });
