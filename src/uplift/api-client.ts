'use client';

/**
 * Hook layer matching the generated @workspace/api-client-react surface
 * from the Uplift-OS reference, reimplemented over the localStorage
 * store. Screen code ported from the reference keeps its data access
 * unchanged: same hook names, same mutate({ id, data }) shapes, same
 * query-key getters used for invalidation.
 */

import {
  useQuery,
  useMutation,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import * as store from './store';
import type {
  Summary,
  SerializedBatch,
  SerializedEnrollment,
  SerializedProfile,
  ProofListItem,
  ProofResult,
  PoolResultView,
  Friend,
  Group,
  Tx,
  Noti,
  BadgeView,
  UpliftApiError,
} from './store';

export type {
  Summary,
  SerializedBatch,
  SerializedEnrollment,
  SerializedProfile,
  ProofListItem,
  ProofResult,
  PoolResultView,
  Friend,
  Group,
  Tx,
  Noti,
  BadgeView,
};
export { UpliftApiError } from './store';
export { resetDb } from './store';

/* ------------------------- query keys ------------------------- */

export const getGetProfileQueryKey = () => ['uplift', 'profile'] as const;
export const getGetSummaryQueryKey = () => ['uplift', 'summary'] as const;
export const getListBatchesQueryKey = () => ['uplift', 'batches'] as const;
export const getGetBatchQueryKey = (id: number) => ['uplift', 'batches', id] as const;
export const getListEnrollmentsQueryKey = () => ['uplift', 'enrollments'] as const;
export const getListProofsQueryKey = (id: number) => ['uplift', 'proofs', id] as const;
export const getGetProofQueryKey = (id: number) => ['uplift', 'proof', id] as const;
export const getGetVaultQueryKey = () => ['uplift', 'vault'] as const;
export const getListTransactionsQueryKey = () => ['uplift', 'transactions'] as const;
export const getListPoolResultsQueryKey = () => ['uplift', 'pools'] as const;
export const getGetEarningsQueryKey = () => ['uplift', 'earnings'] as const;
export const getGetReferralQueryKey = () => ['uplift', 'referral'] as const;
export const getListFriendsQueryKey = () => ['uplift', 'friends'] as const;
export const getGetFriendQueryKey = (id: number) => ['uplift', 'friends', id] as const;
export const getListGroupsQueryKey = () => ['uplift', 'groups'] as const;
export const getGetGroupQueryKey = (id: number) => ['uplift', 'groups', id] as const;
export const getListNotificationsQueryKey = () => ['uplift', 'notifications'] as const;
export const getListBadgesQueryKey = () => ['uplift', 'badges'] as const;

/* ------------------------- helpers ------------------------- */

/** Screens pass orval-style `{ query: { enabled, queryKey, ... } }` options. */
interface QueryOpts {
  query?: {
    enabled?: boolean;
    queryKey?: readonly unknown[];
    staleTime?: number;
  };
}

/** Small async wrapper so store errors reject like network calls. */
function call<T>(fn: () => T, latencyMs = 0): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, latencyMs);
  });
}

function useStoreQuery<T>(
  defaultKey: readonly unknown[],
  fn: () => T,
  options?: QueryOpts,
): UseQueryResult<T, UpliftApiError> {
  return useQuery<T, UpliftApiError>({
    queryKey: options?.query?.queryKey ?? defaultKey,
    queryFn: () => call(fn),
    enabled: options?.query?.enabled,
    staleTime: options?.query?.staleTime,
  });
}

/* ------------------------- queries ------------------------- */

export function useGetSummary(options?: QueryOpts) {
  return useStoreQuery<Summary>(getGetSummaryQueryKey(), () => store.getSummary(), options);
}

export function useGetProfile(options?: QueryOpts) {
  return useStoreQuery<SerializedProfile>(getGetProfileQueryKey(), () => store.getProfile(), options);
}

export function useListBatches(options?: QueryOpts) {
  return useStoreQuery<SerializedBatch[]>(getListBatchesQueryKey(), () => store.listBatches(), options);
}

export function useGetBatch(id: number, options?: QueryOpts) {
  return useStoreQuery<SerializedBatch>(getGetBatchQueryKey(id), () => store.getBatch(id), options);
}

export function useListEnrollments(options?: QueryOpts) {
  return useStoreQuery<SerializedEnrollment[]>(
    getListEnrollmentsQueryKey(),
    () => store.listEnrollments(),
    options,
  );
}

export function useListProofs(id: number, options?: QueryOpts) {
  return useStoreQuery<ProofListItem[]>(getListProofsQueryKey(id), () => store.listProofs(id), options);
}

export function useGetProof(id: number, options?: QueryOpts) {
  return useStoreQuery<ProofListItem & { photo: string | null }>(
    getGetProofQueryKey(id),
    () => store.getProof(id),
    options,
  );
}

export function useGetVault(options?: QueryOpts) {
  return useStoreQuery<{ available: number; protected: number }>(
    getGetVaultQueryKey(),
    () => store.getVault(),
    options,
  );
}

export function useListTransactions(options?: QueryOpts) {
  return useStoreQuery<Tx[]>(getListTransactionsQueryKey(), () => store.listTransactions(), options);
}

export function useListPoolResults(options?: QueryOpts) {
  return useStoreQuery<PoolResultView[]>(
    getListPoolResultsQueryKey(),
    () => store.listPoolResults(),
    options,
  );
}

export function useGetEarnings(options?: QueryOpts) {
  return useStoreQuery(getGetEarningsQueryKey(), () => store.getEarnings(), options);
}

export function useGetReferral(options?: QueryOpts) {
  return useStoreQuery(getGetReferralQueryKey(), () => store.getReferral(), options);
}

export function useListFriends(options?: QueryOpts) {
  return useStoreQuery<Friend[]>(getListFriendsQueryKey(), () => store.listFriends(), options);
}

export function useGetFriend(id: number, options?: QueryOpts) {
  return useStoreQuery<Friend>(getGetFriendQueryKey(id), () => store.getFriend(id), options);
}

export function useListGroups(options?: QueryOpts) {
  return useStoreQuery<Group[]>(getListGroupsQueryKey(), () => store.listGroups(), options);
}

export function useGetGroup(id: number, options?: QueryOpts) {
  return useStoreQuery<Group & { memberList: Friend[] }>(
    getGetGroupQueryKey(id),
    () => store.getGroup(id),
    options,
  );
}

export function useListNotifications(options?: QueryOpts) {
  return useStoreQuery<Noti[]>(getListNotificationsQueryKey(), () => store.listNotifications(), options);
}

export function useListBadges(options?: QueryOpts) {
  return useStoreQuery<BadgeView[]>(getListBadgesQueryKey(), () => store.listBadges(), options);
}

/* ------------------------- mutations ------------------------- */

type Mut<TData, TVars> = UseMutationResult<TData, UpliftApiError, TVars>;

export function useJoinBatch(): Mut<SerializedEnrollment, { id: number; data?: { stake?: number } }> {
  return useMutation({
    mutationFn: (vars) => call(() => store.joinBatch(vars.id, vars.data?.stake), 350),
  });
}

export function useSubmitProof(): Mut<
  ProofResult,
  { id: number; data: { photo?: string; capturedAt?: string; note?: string } }
> {
  // Latency approximates the verification pipeline the verdict screen narrates.
  return useMutation({
    mutationFn: (vars) => call(() => store.submitProof(vars.id, vars.data), 900),
  });
}

export function useDisputeProof(): Mut<ProofResult, { id: number }> {
  return useMutation({
    mutationFn: (vars) => call(() => store.disputeProof(vars.id), 1200),
  });
}

export function useForfeitEnrollment(): Mut<SerializedEnrollment, { id: number }> {
  return useMutation({
    mutationFn: (vars) => call(() => store.forfeitEnrollment(vars.id), 350),
  });
}

export function useTopUp(): Mut<{ available: number; protected: number }, { data: { amount: number } }> {
  return useMutation({
    mutationFn: (vars) => call(() => store.topUp(vars.data.amount), 450),
  });
}

export function useCashOut(): Mut<{ available: number; protected: number }, { data: { amount: number } }> {
  return useMutation({
    mutationFn: (vars) => call(() => store.cashOut(vars.data.amount), 450),
  });
}

export function useUpdateProfile(): Mut<
  SerializedProfile,
  { data: { name?: string; avatarEmoji?: string } }
> {
  return useMutation({
    mutationFn: (vars) => call(() => store.updateProfile(vars.data), 200),
  });
}

export function useAddFriend(): Mut<Friend, { data: { name: string; emoji?: string } }> {
  return useMutation({
    mutationFn: (vars) => call(() => store.addFriend(vars.data), 250),
  });
}

export function useCreateGroup(): Mut<
  Group,
  { data: { name: string; emoji?: string; description?: string } }
> {
  return useMutation({
    mutationFn: (vars) => call(() => store.createGroup(vars.data), 250),
  });
}

export function useMarkNotificationsRead(): Mut<{ error: string }, void> {
  return useMutation({
    mutationFn: () => call(() => store.markNotificationsRead(), 100),
  });
}
