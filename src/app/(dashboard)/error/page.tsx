'use client';

import { useEffect } from 'react';

export default function ErrorTestPage() {
  useEffect(() => {
    const err = new Error('Test error triggered from /error page');
    (err as Error & { digest?: string }).digest = 'TEST-DIGEST-' + Date.now();
    throw err;
  }, []);

  return null;
}
