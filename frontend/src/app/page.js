'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/products');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'sans-serif' }}>
      <p>Redirecting to products...</p>
    </div>
  );
}
