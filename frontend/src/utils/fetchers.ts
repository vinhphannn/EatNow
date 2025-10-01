export async function fetchPublicJSON<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
    // no credentials for public endpoints to enable ISR caching on Vercel/Next
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`);
  }
  return res.json();
}


