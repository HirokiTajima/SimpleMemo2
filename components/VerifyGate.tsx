'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';

export default function VerifyGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('wallet_auth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          setUserAddress(authData.address);
          setOk(true);
        } catch (e) {
          console.error('Failed to parse saved auth:', e);
          localStorage.removeItem('wallet_auth');
        }
      }
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

  async function handleAuth() {
    setError(null);

    try {
      // Generate a random nonce for security
      const nonce = Math.random().toString(36).substring(2, 15);

      console.log('Starting wallet authentication...');

      const res = await MiniKit.commands.walletAuth({
        nonce,
        statement: 'Sign in to SimpleMemo',
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      console.log('WalletAuth response:', res);

      // Check response structure based on MiniKit types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = res as any;

      if (payload && payload.status === 'success') {
        // Success: wallet authenticated
        console.log('Authentication successful!', {
          address: payload.address,
          message: payload.message,
          signature: payload.signature,
        });

        // Store authentication state
        const authData = {
          address: payload.address,
          message: payload.message,
          signature: payload.signature,
          timestamp: Date.now(),
        };
        localStorage.setItem('wallet_auth', JSON.stringify(authData));
        setUserAddress(payload.address);
        setOk(true);
      } else if (payload && payload.status === 'error') {
        // Error response from WalletAuth
        const errorCode = payload.error_code || 'unknown_error';
        const errorDetails = payload.details || '';
        setError(`Authentication error: ${errorCode} - ${errorDetails}`);
        console.error('WalletAuth error:', payload);
      } else {
        // Unexpected response format
        setError('Unexpected response format. Please try again.');
        console.error('Unexpected response:', res);
      }
    } catch (e) {
      console.error('Authentication error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      setError(`Authentication failed: ${errorMessage}`);
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

  // In World App but not authenticated yet
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
        <h3>Sign In to SimpleMemo</h3>
        <p style={{marginBottom: 20, color: '#666'}}>
          Connect your World App wallet to continue
        </p>
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
          onClick={handleAuth}
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
          Sign In with Wallet
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
