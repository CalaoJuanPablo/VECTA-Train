import { apiClient } from '@/lib/api-client';

export default async function SamplePage() {
  const items = await apiClient.getItems();

  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold mb-4">Sample data from API</h1>
      <ul className="list-disc pl-5">
        {items.map((item: { id: string; name: string }) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </main>
  );
}
