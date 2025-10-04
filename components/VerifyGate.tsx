'use client';

import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

const ACTION_ID = process.env.NEXT_PUBLIC_WLD_ACTION_ID ?? '';
const STORAGE_KEY = 'wld_verified';

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] =
    useState<'checking'|'need'|'verifying'|'ok'|'error'|'unavailable'>('checking');

  useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    setStatus(v === 'true' ? 'ok' : 'need');
  }, []);

  const doVerify = async () => {
    if (!MiniKit.isInstalled()) { setStatus('unavailable'); return; }
    try {
      setStatus('verifying');
      await MiniKit.commands.verify({ actionId: ACTION_ID });
      localStorage.setItem(STORAGE_KEY, 'true');
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'checking' || status === 'verifying')
    return <main style={{ padding:20 }}><p>Verifying…</p></main>;
  if (status === 'unavailable')
    return <main style={{ padding:20 }}><h2>Open in World App</h2><p>This app requires World App to verify your World ID.</p></main>;
  if (status === 'need' || status === 'error')
    return <main style={{ padding:20, display:'grid', gap:12 }}>
      <h2>Verify with World ID</h2>
      {status==='error' && <p>❌ Verification failed. Please try again.</p>}
      <button onClick={doVerify} style={{ padding:12, border:'1px solid #ccc', borderRadius:8 }}>
        Verify to continue
      </button>
    </main>;

  return <>{children}</>;
}
