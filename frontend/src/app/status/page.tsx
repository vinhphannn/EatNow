'use client';

import { useState, useEffect } from 'react';

interface HealthData {
  error?: string;
  [key: string]: any;
}

async function fetchHealth(): Promise<HealthData> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${base}/health`);
    if (!res.ok) throw new Error('Bad response');
    return res.json();
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      const healthData = await fetchHealth();
      setData(healthData);
      setLoading(false);
    }

    loadHealth();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">System Status</h1>
      {loading ? (
        <div className="mt-4">Đang tải...</div>
      ) : (
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}