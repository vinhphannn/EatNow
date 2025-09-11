async function fetchHealth() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${base}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Bad response');
    return res.json();
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export default async function StatusPage() {
  const data = await fetchHealth();
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">System Status</h1>
      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}



