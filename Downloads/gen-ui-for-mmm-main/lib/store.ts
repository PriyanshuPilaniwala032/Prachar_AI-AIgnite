import { create } from "zustand";

interface TableStore {
  selectedTable: string | null;
  hasSelectedTable: boolean;
  setSelectedTable: (table: string) => void;
}

export const useTableStore = create<TableStore>((set) => ({
  selectedTable: null,
  hasSelectedTable: false, // ✅ Track if the user has selected a table
  setSelectedTable: (table) => set({ selectedTable: table, hasSelectedTable: true }),
}));
