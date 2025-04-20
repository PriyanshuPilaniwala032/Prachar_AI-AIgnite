"use client"; // ✅ This must be a Client Component

import { useTableStore } from "@/lib/store";
import { Chat } from "@/components/chat";

export function ClientTableProvider({ id, selectedModelId }: { id: string; selectedModelId: string }) {
  const { selectedTable } = useTableStore(); // ✅ Zustand now works inside a Client Component

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      selectedVisibilityType="private"
      isReadonly={false}
      selectedTable={selectedTable} // ✅ Now selectedTable is passed correctly
    />
  );
}
