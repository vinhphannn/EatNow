"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DebugAuthPage() {
  const { isAuthenticated, user, isLoading, tokens } = useAuth();

  console.log("🔍 DebugAuth: Auth state:", { isAuthenticated, user, isLoading, tokens });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Auth State</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Current Auth State:</h2>
          
          <div className="space-y-2">
            <div><strong>isAuthenticated:</strong> {isAuthenticated ? "✅ true" : "❌ false"}</div>
            <div><strong>isLoading:</strong> {isLoading ? "⏳ true" : "✅ false"}</div>
            <div><strong>user:</strong> {user ? "✅ " + JSON.stringify(user, null, 2) : "❌ null"}</div>
            <div><strong>tokens:</strong> {tokens ? "✅ " + JSON.stringify(tokens, null, 2) : "❌ null"}</div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold">Check console logs for detailed AuthGuard logs</h3>
        </div>
      </div>
    </div>
  );
}
