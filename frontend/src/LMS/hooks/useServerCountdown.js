import { useEffect, useRef, useState } from 'react';

/**
 * Computes remaining seconds against a server-provided deadline adjusted
 * for local clock skew using serverNow.
 */
export function useServerCountdown({ expiresAt, serverNow, onExpire }) {
  const skewMsRef = useRef(0);
  const expiredFiredRef = useRef(false);

  useEffect(() => {
    if (serverNow) {
      const serverTime = new Date(serverNow).getTime();
      if (!Number.isNaN(serverTime)) {
        skewMsRef.current = serverTime - Date.now();
      }
    }
    expiredFiredRef.current = false;
  }, [expiresAt, serverNow]);

  const computeRemaining = () => {
    if (!expiresAt) return 0;
    const deadlineMs = new Date(expiresAt).getTime();
    if (Number.isNaN(deadlineMs)) return 0;
    const estimatedServerNow = Date.now() + skewMsRef.current;
    return Math.max(0, Math.floor((deadlineMs - estimatedServerNow) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState(computeRemaining);

  useEffect(() => {
    setRemainingSeconds(computeRemaining());
    if (!expiresAt) return undefined;

    const timer = setInterval(() => {
      const next = computeRemaining();
      setRemainingSeconds(next);
      if (next <= 0 && !expiredFiredRef.current) {
        expiredFiredRef.current = true;
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return remainingSeconds;
}

