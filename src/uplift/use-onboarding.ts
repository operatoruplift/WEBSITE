'use client';

import { useState } from 'react';

const ONBOARDING_KEY = 'uplift_onboarding_seen';

/** localStorage can throw on access in strict-privacy / sandboxed contexts.
 *  Guarding keeps a blocked store from crashing the app to the error boundary. */
function readSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useOnboarding() {
  const [hasSeen, setHasSeen] = useState<boolean>(readSeen);

  const markSeen = () => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // Storage blocked: keep the session-local state so the app still works.
    }
    setHasSeen(true);
  };

  return { hasSeen, markSeen };
}
