import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let scriptLoadingPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

// Renders Google's official "Continue with Google" button.
// Requires VITE_GOOGLE_CLIENT_ID (frontend) + GOOGLE_CLIENT_ID (backend) to be set —
// until then it shows a disabled placeholder so the rest of the UI still works.
export default function GoogleButton({ onError }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              const res = await api.post('/auth/google', { credential: response.credential });
              login(res.data.user, res.data.token);
              const dest = res.data.user.role === 'admin'
                ? '/admin'
                : res.data.user.role === 'doctor'
                  ? '/doctor/dashboard'
                  : '/doctors';
              window.location.href = dest;
            } catch (err) {
              onError?.(err.response?.data?.message || 'Google sign-in failed. Please try again.');
            }
          },
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
          });
        }
        setReady(true);
      })
      .catch(() => onError?.('Could not load Google Sign-In. Check your connection.'));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button type="button" className="btn btn-outline google-btn-placeholder" disabled title="Set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable">
        <GoogleIcon /> Continue with Google
      </button>
    );
  }

  return (
    <div className="google-btn-wrap">
      <div ref={buttonRef} />
      {!ready && (
        <button type="button" className="btn btn-outline google-btn-placeholder" disabled>
          <GoogleIcon /> Continue with Google
        </button>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.9v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.04l3.06-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.96l3.06 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
