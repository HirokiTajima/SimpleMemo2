'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wld_verified') === '1') {
      setOk(true);
    }
  }, []);

  async function handleVerify() {
    try {
      const res = await MiniKit.commands.verify({
        action: process.env.NEXT_PUBLIC_WLD_ACTION_ID!,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (res && (res as any).finalPayload) {
        localStorage.setItem('wld_verified', '1');
        setOk(true);
      }
    } catch (e) {
      console.error(e);
      alert('Verification failed.');
    }
  }

  // World App の中じゃない場合は案内だけ
  const inWorldApp = MiniKit.isInstalled();
  if (!ok && !inWorldApp) {
    return (
      <div style={{padding:20}}>
        <h3>Open in World App</h3>
        <p>Please open this page inside World App to verify.</p>
      </div>
    );
  }

  if (!ok) {
    return (
      <div style={{padding:20}}>
        <h3>Verify with World ID</h3>
        <button onClick={handleVerify} style={{padding:12}}>Verify to continue</button>
      </div>
    );
  }

  return <>{children}</>;
}
