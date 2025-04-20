import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    console.log("📡 [API] Fetching table names from Neon PostgreSQL...");

    const result = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;

    console.log("✅ [API] Tables retrieved:", result.rows);

    return NextResponse.json({ tables: result.rows.map(row => row.table_name) });
  } catch (error) {
    console.error("❌ [API] Error fetching tables:", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}
