'use client';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if already verified
    if (typeof window !== 'undefined' && localStorage.getItem('wld_verified') === '1') {
      setOk(true);
    }

    // Check if MiniKit is installed after component mount
    const checkInstalled = () => {
      const installed = MiniKit.isInstalled();
      setIsInstalled(installed);
      setIsChecking(false);
    };

    // Give MiniKit a moment to fully initialize
    const timer = setTimeout(checkInstalled, 200);
    return () => clearTimeout(timer);
  }, []);

  async function handleVerify() {
    try {
      const res = await MiniKit.commands.verify({
        action: process.env.NEXT_PUBLIC_WLD_ACTION_ID!,
        verification_level: VerificationLevel.Device, // Device Level authentication (not Orb)
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (res && (res as any).finalPayload) {
        localStorage.setItem('wld_verified', '1');
        setOk(true);
      }
    } catch (e) {
      console.error(e);
      alert('Verification failed. Please try again.');
    }
  }

  // Still checking MiniKit installation
  if (isChecking) {
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

  // Not in World App
  if (!ok && !isInstalled) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: 20,
        fontFamily: 'system-ui',
        textAlign: 'center'
      }}>
        <h3>Open in World App</h3>
        <p>Please open this page inside World App to verify with World ID.</p>
      </div>
    );
  }

  // In World App but not verified yet
  if (!ok) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: 20,
        fontFamily: 'system-ui',
        textAlign: 'center'
      }}>
        <h3>Verify with World ID</h3>
        <p style={{marginBottom: 20}}>Device Level verification required</p>
        <button
          onClick={handleVerify}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Verify to Continue
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
