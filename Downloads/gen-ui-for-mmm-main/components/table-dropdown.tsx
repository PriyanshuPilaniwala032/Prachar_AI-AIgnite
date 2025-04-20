import { useTableStore } from "@/lib/store";
import { useEffect, useState } from "react";

// ✅ Fetch tables with improved error handling
async function fetchTables() {
  console.log("📡 Fetching table list ...");
  try {
    const response = await fetch("/api/database");
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    console.log("✅ Tables received:", data);
    return data.tables || [];
  } catch (error) {
    console.error("❌ Error fetching tables:", error);
    return [];
  }
}

export function TableDropdown() {
  const { selectedTable, setSelectedTable } = useTableStore();
  const [tables, setTables] = useState<string[]>([]);
  const [isTableSelected, setIsTableSelected] = useState(false); // ✅ Track selection


  useEffect(() => {
    fetchTables().then(setTables);
  }, []);

  useEffect(() => {
    console.log("🔄 Selected Table Updated:", selectedTable);
  }, [selectedTable]);


  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const table = e.target.value;
    console.log("📌 Changing selectedTable to:", table);
    setSelectedTable(table);
    setIsTableSelected(true); // ✅ Hide dropdown after selection
  };

  if (isTableSelected && selectedTable) {
    return (
      <p className="text-accent-foreground">
        <strong>{selectedTable}</strong>
      </p>
    );
  }    
  return (
    <div className="gap-4 group/item flex flex-row justify-between items-center">
      <select
        value={selectedTable || ""}
        onChange={handleSelect}
        className="gap-4 group/item flex flex-row justify-between items-center"
      >
        <option value="">Choose a Table</option>
        {tables.map((table) => (
          <option key={table} value={table}>
            {table}
          </option>
        ))}
      </select>
    </div>
  );
}
