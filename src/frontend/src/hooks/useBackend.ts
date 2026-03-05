import type { Principal } from "@dfinity/principal";
import type { Identity } from "@icp-sdk/core/agent";
import { useMemo } from "react";
import { createActorWithConfig } from "../config";
import { useInternetIdentity } from "./useInternetIdentity";

// ─── Backend Types ─────────────────────────────────────────────────────────

export type PostCategory = { Announcement: null } | { Petition: null };

export type BackendPost = {
  id: bigint;
  title: string;
  description: string;
  category: PostCategory;
  author: Principal;
  createdAt: bigint;
  signatureCount: bigint;
};

export type BackendVault = {
  id: bigint;
  title: string;
  description: string;
  targetAmount: bigint;
  currentAmount: bigint;
  deadline: bigint;
  creator: Principal;
  createdAt: bigint;
  withdrawn: boolean;
  contributorCount: bigint;
};

export type BackendContribution = {
  vaultId: bigint;
  contributor: Principal;
  amount: bigint;
  createdAt: bigint;
};

export type AppBackend = {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  // Posts
  createPost(
    title: string,
    description: string,
    category: PostCategory,
  ): Promise<bigint>;
  getPosts(): Promise<BackendPost[]>;
  getPost(id: bigint): Promise<[] | [BackendPost]>;
  signPost(postId: bigint): Promise<boolean>;
  hasSignedPost(postId: bigint): Promise<boolean>;
  // Vaults
  createVault(
    title: string,
    description: string,
    targetAmount: bigint,
    deadline: bigint,
  ): Promise<bigint>;
  getVaults(): Promise<BackendVault[]>;
  getVault(id: bigint): Promise<[] | [BackendVault]>;
  contribute(vaultId: bigint, amount: bigint): Promise<boolean>;
  withdrawVault(vaultId: bigint): Promise<boolean>;
  getContributions(vaultId: bigint): Promise<BackendContribution[]>;
};

// ─── Actor cache ────────────────────────────────────────────────────────────

let anonActorCache: AppBackend | null = null;
let authActorCache: { identity: Identity; actor: AppBackend } | null = null;

export async function getAnonActor(): Promise<AppBackend> {
  if (!anonActorCache) {
    anonActorCache = (await createActorWithConfig()) as unknown as AppBackend;
  }
  return anonActorCache;
}

export async function getAuthActor(identity: Identity): Promise<AppBackend> {
  if (
    authActorCache &&
    authActorCache.identity
      .getPrincipal()
      .compareTo(identity.getPrincipal()) === "eq"
  ) {
    return authActorCache.actor;
  }
  const actor = (await createActorWithConfig({
    agentOptions: { identity },
  })) as unknown as AppBackend;
  authActorCache = { identity, actor };
  return actor;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useBackend() {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const principal = identity?.getPrincipal().toText() ?? null;

  // Stable reference for identity-based actor creation
  const getAuthenticatedActor = useMemo(() => {
    if (!identity) return null;
    return () => getAuthActor(identity);
  }, [identity]);

  return {
    isLoggedIn,
    principal,
    getAnonActor,
    getAuthActor: getAuthenticatedActor,
  };
}
