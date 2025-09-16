'use client';

import { useAppLoading } from '../../components';

export default function TestLoadingPage() {
  const { isLoading, setLoading } = useAppLoading();

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Loading Screen Test</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Loading Controls</h2>
            <div className="space-x-4">
              <button
                onClick={() => setLoading(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Show Loading
              </button>
              <button
                onClick={() => setLoading(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Hide Loading
              </button>
            </div>
            <p className="mt-4 text-gray-600">
              Current loading state: <span className="font-semibold">{isLoading ? 'Loading' : 'Not Loading'}</span>
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Animated particles background</li>
              <li>✅ Progress bar with percentage</li>
              <li>✅ Smooth transitions</li>
              <li>✅ Responsive design</li>
              <li>✅ Customizable duration</li>
              <li>✅ Programmatic control</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Usage</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { useAppLoading } from '../components';

function MyComponent() {
  const { isLoading, setLoading } = useAppLoading();
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      <button onClick={() => setLoading(true)}>
        Show Loading
      </button>
    </div>
  );
}`}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
