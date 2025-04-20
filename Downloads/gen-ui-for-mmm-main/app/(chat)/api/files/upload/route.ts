import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { IncomingMessage } from "http";
import { once } from "events";
import { Readable } from "stream";

// ✅ Ensure API runs in Node.js, NOT Edge runtime
export const config = {
  api: {
    bodyParser: false, // ✅ Required for Formidable to work
  },
};

// ✅ Ensure `uploads/` directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📂 Created uploads directory: ${UPLOAD_DIR}`);
}

// ✅ Handle `GET` request (for debugging in browser)
export async function GET() {
  return new NextResponse(
    JSON.stringify({ message: "✅ File Upload API is working! Use POST to upload files." }),
    { status: 200 }
  );
}

// ✅ Read Full Request Body Before Passing to Formidable
async function bufferRequest(req: NextRequest): Promise<Buffer> {
  const chunks = [];
  const reader = req.body?.getReader();
  if (!reader) throw new Error("Request body is empty.");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}


async function convertNextRequestToNodeRequest(req: NextRequest): Promise<IncomingMessage> {
  console.log("🟡 [convertNextRequestToNodeRequest] - Start conversion");

  try {
    // ✅ Read Request Body as Buffer
    const bodyBuffer = await req.arrayBuffer();
    console.log(`✅ [Step 1] Read request body. Size: ${bodyBuffer.byteLength} bytes`);

    // ✅ Create a Readable Stream
    const readableStream = new Readable();
    readableStream.push(Buffer.from(bodyBuffer));
    readableStream.push(null);
    console.log("✅ [Step 2] Readable stream created");

    // ✅ Create Node.js IncomingMessage
    const nodeReq = Object.create(IncomingMessage.prototype);
    nodeReq.headers = Object.fromEntries(req.headers);
    nodeReq.method = req.method;
    nodeReq.url = req.url;

    // ✅ Assign the Readable Stream
    Object.assign(nodeReq, readableStream);

    console.log("✅ [Step 3] Successfully converted NextRequest to IncomingMessage");
    return nodeReq;
  } catch (error) {
    console.error("❌ [convertNextRequestToNodeRequest] Error:", error);
    throw error;
  }
}



export async function POST(req: NextRequest) {
  console.log("🟡 [Step 1] Received POST request at /api/files/upload");

  try {
    // ✅ Step 1: Check if Request was Aborted
    if (req.signal.aborted) {
      console.error("❌ [Step 1] Request was aborted before processing.");
      return new NextResponse(JSON.stringify({ message: "Request was aborted." }), { status: 400 });
    }
    console.log("✅ [Step 1] Request is valid and not aborted.");

    // ✅ Step 2: Convert `NextRequest` to a Proper Node.js `IncomingMessage`
    console.log("📌 [Step 2] Converting NextRequest to Node.js IncomingMessage...");
    const nodeRequest = await convertNextRequestToNodeRequest(req);
    console.log("✅ [Step 2] Successfully converted NextRequest.");

    // ✅ Step 3: Ensure Request is Fully Read Before Parsing
    console.log("📌 [Step 3] Ensuring the request body is fully read...");
    nodeRequest.on("end", () => {
      console.log("✅ [Step 3] Request body fully read.");
    });

    // ✅ Step 4: Configure Formidable for file uploads
    console.log("📌 [Step 4] Configuring Formidable for file upload...");
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      multiples: false, // ✅ Only allow single file upload
    });
    console.log("✅ [Step 4] Formidable configured.");

    // ✅ Step 5: Parse Form Data (Extract CSV file)
    console.log("📌 [Step 5] Parsing form data for uploaded file...");
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
      (resolve, reject) => {
        form.parse(nodeRequest, (err, fields, files) => {
          if (err) {
            console.error("❌ [Step 5] Error parsing form data:", err);
            return reject(err);
          }
          console.log("✅ [Step 5] Form data successfully parsed.");
          resolve({ fields, files });
        });
      }
    );

    console.log("📂 [Step 6] Parsed Form Data:", { fields, files });

    // ✅ Step 6: Validate File Upload
    if (!files.csvFile) {
      console.error("❌ [Step 6] No file received.");
      return new NextResponse(JSON.stringify({ message: "No file received." }), { status: 400 });
    }


    const file = Array.isArray(files.csvFile) ? files.csvFile[0] : files.csvFile;
    const originalName = file.originalFilename || "unknown";
    const baseName = path.basename(originalName, path.extname(originalName));
    const randomValue = Math.random().toString(36).substring(2, 8); // 6-char random string
    const newFileName = `${baseName}_${randomValue}${path.extname(originalName)}`;
    const newFilePath = path.join(UPLOAD_DIR, newFileName);

    // ✅ Rename the uploaded file to the new randomized filename
    fs.renameSync(file.filepath, newFilePath);

    console.log(`📂 [Step 7] File received: ${originalName}`);
    console.log(`📂 [Step 7] Renamed File: ${newFileName}`);
    console.log(`📂 [Step 7] New File Path: ${newFilePath}`);
    const filePath = file.filepath;


    // ✅ Step 7: Execute `seed.ts` for processing CSV
    console.log("📌 [Step 8] Running `seed.ts` script to process the uploaded CSV...");
    exec(`npx tsx ${path.join(process.cwd(), "lib", "seed.ts")} "${newFilePath}"`, (error, stdout, stderr) => {

      if (error) {
        console.error(`❌ [Step 8] Error running seed.ts: ${stderr}`);
      } else {
        console.log(`✅ [Step 8] seed.ts executed successfully.`);
        console.log(`📄 [Step 8] Output: ${stdout}`);
      }
    });
    
    // ✅ Step 8: Send Response Back to Client
    console.log("✅ [Step 9] Responding to client: File uploaded successfully!");
    return new NextResponse(JSON.stringify({ message: "✅ File uploaded successfully! Processing CSV now." }), { status: 200 });

  } catch (error) {
    console.error("❌ [Step 10] API Error:", error);
    return new NextResponse(JSON.stringify({ message: "❌ Internal Server Error" }), { status: 500 });
  }
}
