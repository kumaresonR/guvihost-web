import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

export function isGoogleLoginAvailable(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function useGoogleSignInButton(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onCredential: (idToken: string) => void,
  disabled = false
) {
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled || !containerRef.current) return;

    const mount = () => {
      if (!containerRef.current || !window.google?.accounts?.id) return;
      containerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) onCredentialRef.current(response.credential);
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      mount();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = mount;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [containerRef, disabled]);
}
