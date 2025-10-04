'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import React, { useEffect, useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Install MiniKit with App ID
    MiniKit.install(process.env.NEXT_PUBLIC_APP_ID!);

    // Wait a moment for MiniKit to initialize
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
