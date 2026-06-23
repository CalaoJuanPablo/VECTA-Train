import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">VECTA Train</h1>
      <Link href="/sample" className="text-blue-600 underline">
        View sample page
      </Link>
    </main>
  );
}
