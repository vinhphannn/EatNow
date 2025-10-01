'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverRegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/driver/login?register=1');
  }, [router]);

  return null;
}
