'use client';

import { useState } from 'react';

const ONBOARDING_KEY = 'uplift_onboarding_seen';

export function useOnboarding() {
  const [hasSeen, setHasSeen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const markSeen = () => {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeen(true);
  };

  return { hasSeen, markSeen };
}
