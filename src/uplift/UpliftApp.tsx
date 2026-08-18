'use client';

/**
 * Uplift PWA root: the phone-framed habit-staking app, mounted under
 * /app by an optional catch-all Next route. Routing inside the app is
 * wouter over native history so screen changes never trigger a Next
 * navigation; all data lives in the localStorage store.
 */

import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

import './uplift.css';
import { ErrorBoundary } from '@/src/uplift/error-boundary';
import { PhoneFrame, TabBar } from '@/src/uplift/system';
import { useOnboarding } from '@/src/uplift/use-onboarding';

import Home from '@/src/uplift/pages/home';
import Browse from '@/src/uplift/pages/browse';
import BatchDetail from '@/src/uplift/pages/batch-detail';
import Proof, { Victory, Forfeit } from '@/src/uplift/pages/proof';
import Social from '@/src/uplift/pages/social';
import FriendDetail from '@/src/uplift/pages/friend-detail';
import GroupDetail from '@/src/uplift/pages/group-detail';
import Journey from '@/src/uplift/pages/journey';
import History from '@/src/uplift/pages/history';
import Settings from '@/src/uplift/pages/settings';
import Referral from '@/src/uplift/pages/referral';
import Vault, { TopUp, CashOut } from '@/src/uplift/pages/vault';
import Activity from '@/src/uplift/pages/activity';
import Earnings from '@/src/uplift/pages/earnings';
import Pool from '@/src/uplift/pages/pool';
import Notifications from '@/src/uplift/pages/notifications';
import Onboarding from '@/src/uplift/pages/onboarding';
import NotFound from '@/src/uplift/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const showTabNav = ['/app', '/app/social', '/app/journey', '/app/vault'].includes(location);

  return (
    <div className="ou-app min-h-[100dvh] bg-stone-900 w-full flex items-center justify-center">
      <PhoneFrame>
        {children}
        {showTabNav && <TabBar active={location} />}
      </PhoneFrame>
    </div>
  );
}

function AppArea() {
  const { hasSeen, markSeen } = useOnboarding();
  const [, setLocation] = useLocation();

  if (!hasSeen) {
    return (
      <Onboarding
        onDone={() => {
          markSeen();
          setLocation('/app');
        }}
      />
    );
  }

  return (
    <Switch>
      <Route path="/app" component={Home} />
      <Route path="/app/browse" component={Browse} />
      <Route path="/app/batches/:id" component={BatchDetail} />

      {/* Proof / forfeit flows */}
      <Route path="/app/proof" component={Proof} />
      <Route path="/app/proof/victory">
        <Victory />
      </Route>
      <Route path="/app/proof/victory-completed">
        <Victory completed />
      </Route>
      <Route path="/app/forfeit" component={Forfeit} />

      {/* Social */}
      <Route path="/app/social" component={Social} />
      <Route path="/app/friends/:id" component={FriendDetail} />
      <Route path="/app/groups/:id" component={GroupDetail} />

      {/* Journey */}
      <Route path="/app/journey" component={Journey} />
      <Route path="/app/history" component={History} />
      <Route path="/app/settings" component={Settings} />
      <Route path="/app/referral" component={Referral} />

      {/* Vault */}
      <Route path="/app/vault" component={Vault} />
      <Route path="/app/vault/topup" component={TopUp} />
      <Route path="/app/vault/cashout" component={CashOut} />
      <Route path="/app/activity" component={Activity} />
      <Route path="/app/earnings" component={Earnings} />
      <Route path="/app/pool" component={Pool} />
      <Route path="/app/pool/:id" component={Pool} />
      <Route path="/app/notifications" component={Notifications} />

      <Route component={NotFound} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export default function UpliftApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <RoutedErrorBoundary>
          <AppShell>
            <AppArea />
          </AppShell>
        </RoutedErrorBoundary>
      </WouterRouter>
      <Toaster position="top-center" richColors theme="system" />
    </QueryClientProvider>
  );
}
