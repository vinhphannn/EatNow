"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function DebugLoginPage() {
  const [email, setEmail] = useState("admin@eatnow.com");
  const [password, setPassword] = useState("admin123");
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { login, isAuthenticated, user, isLoading, error } = useAuth();

  const handleLogin = async () => {
    setDebugInfo(null);
    
    try {
      console.log("🔍 Starting login process...");
      
      // Test API call directly
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log("📡 API Response status:", response.status);
      console.log("📡 API Response headers:", Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log("📡 API Response data:", data);
      
      setDebugInfo({
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (response.ok) {
        console.log("✅ API call successful, now calling authService.login...");
        
        // Now test authService login
        await login({ email, password });
        console.log("✅ AuthService login completed");
        
        // Force redirect if admin
        if (user?.role === 'admin') {
          console.log("🔍 Force redirecting to admin dashboard");
          window.location.href = '/admin/dashboard';
        }
        
        setDebugInfo(prev => ({
          ...prev,
          authServiceResult: "Login completed successfully",
          authState: {
            isAuthenticated,
            user,
            isLoading,
            error
          }
        }));
      }
      
    } catch (error) {
      console.error("❌ Login error:", error);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        authState: {
          isAuthenticated,
          user,
          isLoading,
          error
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug Login</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Login Form</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Login"}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              isAuthenticated,
              user,
              isLoading,
              error
            }, null, 2)}
          </pre>
        </div>
        
        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-600">
          <p>Check browser console for detailed logs</p>
          <p>Expected API response format:</p>
          <pre className="bg-gray-100 p-2 rounded mt-2">
{`{
  "access_token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@eatnow.com",
    "role": "admin",
    "name": "Admin User"
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
