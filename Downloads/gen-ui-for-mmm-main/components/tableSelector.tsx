"use client";

import { useState, useEffect } from "react";
import { useTableStore } from "@/lib/store"; // ✅ Import Zustand store

export default function TableSelector() {
  const { selectedTable, setSelectedTable } = useTableStore(); // ✅ Zustand state
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTables() {
      console.log("📡 Fetching tables...");
      try {
        const response = await fetch("/api/database");
        const data = await response.json();
        if (data.tables) {
          console.log("✅ Tables retrieved:", data.tables);
          setTables(data.tables);
        } else {
          console.error("❌ No tables found");
        }
      } catch (error) {
        console.error("❌ Error fetching tables:", error);
      }
    }

    fetchTables();
  }, []);

  return (
    <div className="flex items-center gap-4">
      <label className="text-lg font-semibold">Database Tables:</label>
      {tables.length > 0 ? (
        <select
          className="border p-2 rounded"
          value={selectedTable || ""}
          onChange={(e) => {
            const newTable = e.target.value;
            console.log("📌 UI: Selected Table Changed →", newTable); // ✅ Log selection
            setSelectedTable(newTable);
          }}
        >
          <option value="">Select a Table</option>
          {tables.map((table) => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      ) : (
        <p>Loading tables...</p>
      )}
    </div>
  );
}
