import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { ClientTableProvider } from "@/components/client-table-provider"; // ✅ New Client Component

export default async function Page() {
  const id = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <ClientTableProvider id={id} selectedModelId={selectedModelId} />
  );
}
