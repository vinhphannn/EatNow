const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  auth: boolean = false
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Cookie-based auth: no need to add Authorization header
  // Cookies are automatically included with credentials: 'include'

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch (jsonError) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
