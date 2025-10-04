'use client';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    const actionId = process.env.NEXT_PUBLIC_ACTION_ID;

    if (!actionId) {
      setError('Action ID not configured. Please check environment variables.');
      console.error('NEXT_PUBLIC_ACTION_ID is not set');
      return;
    }

    try {
      console.log('Starting verification with action:', actionId);

      const res = await MiniKit.commands.verify({
        action: actionId,
        verification_level: VerificationLevel.Device,
      });

      console.log('Verification response:', res);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (res && (res as any).finalPayload) {
        localStorage.setItem('wld_verified', '1');
        setOk(true);
      } else {
        setError('Verification response invalid. Please try again.');
        console.error('Invalid response:', res);
      }
    } catch (e) {
      console.error('Verification error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Verification failed: ${errorMessage}`);
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
        <p style={{marginBottom: 20, color: '#666'}}>Device Level verification required</p>
        {error && (
          <div style={{
            marginBottom: 20,
            padding: '12px 16px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: 8,
            fontSize: 14,
            maxWidth: 400
          }}>
            {error}
          </div>
        )}
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
