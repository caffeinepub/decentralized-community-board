import { Actor, type ActorConfig, type HttpAgentOptions } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import type { Principal } from "@dfinity/principal";

// ─── Candid IDL ─────────────────────────────────────────────────────────────

const PostCategoryIDL = IDL.Variant({
  Announcement: IDL.Null,
  Petition: IDL.Null,
});

const UserRoleIDL = IDL.Variant({
  Admin: IDL.Null,
  User: IDL.Null,
  Guest: IDL.Null,
});

const PostIDL = IDL.Record({
  id: IDL.Nat,
  title: IDL.Text,
  description: IDL.Text,
  category: PostCategoryIDL,
  author: IDL.Principal,
  createdAt: IDL.Int,
  signatureCount: IDL.Nat,
});

const VaultIDL = IDL.Record({
  id: IDL.Nat,
  title: IDL.Text,
  description: IDL.Text,
  targetAmount: IDL.Nat,
  currentAmount: IDL.Nat,
  deadline: IDL.Int,
  creator: IDL.Principal,
  createdAt: IDL.Int,
  withdrawn: IDL.Bool,
  contributorCount: IDL.Nat,
});

const ContributionIDL = IDL.Record({
  vaultId: IDL.Nat,
  contributor: IDL.Principal,
  amount: IDL.Nat,
  createdAt: IDL.Int,
});

const idlFactory: IDL.InterfaceFactory = ({ IDL: _IDL }) => {
  return _IDL.Service({
    _initializeAccessControlWithSecret: _IDL.Func([_IDL.Text], [], []),
    getCallerUserRole: _IDL.Func([], [UserRoleIDL], ["query"]),
    isCallerAdmin: _IDL.Func([], [_IDL.Bool], ["query"]),
    assignCallerUserRole: _IDL.Func([_IDL.Principal, UserRoleIDL], [], []),
    createPost: _IDL.Func(
      [_IDL.Text, _IDL.Text, PostCategoryIDL],
      [_IDL.Nat],
      [],
    ),
    getPosts: _IDL.Func([], [_IDL.Vec(PostIDL)], ["query"]),
    getPost: _IDL.Func([_IDL.Nat], [_IDL.Opt(PostIDL)], ["query"]),
    signPost: _IDL.Func([_IDL.Nat], [_IDL.Bool], []),
    hasSignedPost: _IDL.Func([_IDL.Nat], [_IDL.Bool], ["query"]),
    createVault: _IDL.Func(
      [_IDL.Text, _IDL.Text, _IDL.Nat, _IDL.Int],
      [_IDL.Nat],
      [],
    ),
    getVaults: _IDL.Func([], [_IDL.Vec(VaultIDL)], ["query"]),
    getVault: _IDL.Func([_IDL.Nat], [_IDL.Opt(VaultIDL)], ["query"]),
    contribute: _IDL.Func([_IDL.Nat, _IDL.Nat], [_IDL.Bool], []),
    withdrawVault: _IDL.Func([_IDL.Nat], [_IDL.Bool], []),
    getContributions: _IDL.Func(
      [_IDL.Nat],
      [_IDL.Vec(ContributionIDL)],
      ["query"],
    ),
  });
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type backendInterface = {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  getPosts(): Promise<BackendPost[]>;
  getPost(id: bigint): Promise<[] | [BackendPost]>;
  createPost(
    title: string,
    description: string,
    category: BackendPostCategory,
  ): Promise<bigint>;
  signPost(postId: bigint): Promise<boolean>;
  hasSignedPost(postId: bigint): Promise<boolean>;
  getVaults(): Promise<BackendVault[]>;
  getVault(id: bigint): Promise<[] | [BackendVault]>;
  createVault(
    title: string,
    description: string,
    targetAmount: bigint,
    deadline: bigint,
  ): Promise<bigint>;
  contribute(vaultId: bigint, amount: bigint): Promise<boolean>;
  withdrawVault(vaultId: bigint): Promise<boolean>;
  getContributions(vaultId: bigint): Promise<BackendContribution[]>;
};

export type BackendPostCategory =
  | { Announcement: null }
  | { Petition: null };

export type BackendPost = {
  id: bigint;
  title: string;
  description: string;
  category: BackendPostCategory;
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

export type CreateActorOptions = {
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  agent?: import("@dfinity/agent").HttpAgent;
  processError?: (e: unknown) => never;
  [key: string]: unknown;
};

export class ExternalBlob {
  private url: string;
  constructor(url: string) {
    this.url = url;
  }
  static fromURL(url: string): ExternalBlob {
    return new ExternalBlob(url);
  }
  async getBytes(): Promise<Uint8Array> {
    const resp = await fetch(this.url);
    const buf = await resp.arrayBuffer();
    return new Uint8Array(buf);
  }
  onProgress: ((progress: number) => void) | undefined;
}

// ─── Actor factory ───────────────────────────────────────────────────────────

export async function createActor(
  canisterId: string,
  _uploadFile: unknown,
  _downloadFile: unknown,
  options?: CreateActorOptions,
): Promise<backendInterface> {
  const agent = options?.agent;
  const actorConfig: ActorConfig = {
    canisterId,
    ...(agent ? { agent } : {}),
  };

  const actor = Actor.createActor(idlFactory, actorConfig) as backendInterface;
  return actor;
}
