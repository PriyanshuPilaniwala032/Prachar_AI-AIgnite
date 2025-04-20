import express from "express";
import multer from "multer";
import { exec } from "child_process";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());

// Multer setup: Store the uploaded CSV file in the `uploads/` folder
const upload = multer({ dest: "uploads/" });

// Upload endpoint
app.post("/upload", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const csvFilePath = path.join(process.cwd(), req.file.path);

  console.log(`Processing CSV: ${csvFilePath}`);

  // Run `seed.ts` and pass the file path
  exec(`node seed.js ${csvFilePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running seed.ts: ${stderr}`);
      return res.status(500).json({ message: "Error processing CSV file." });
    }

    console.log(`✅ Success: ${stdout}`);
    res.json({ message: "CSV data uploaded successfully!" });
  });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
