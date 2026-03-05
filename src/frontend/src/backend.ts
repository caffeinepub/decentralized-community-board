// Stub backend – no canister deployed for this app
import type { ActorConfig, HttpAgentOptions } from "@dfinity/agent";

export type backendInterface = {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
};

export type CreateActorOptions = {
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
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

export async function createActor(
  ..._args: unknown[]
): Promise<backendInterface> {
  return {
    async _initializeAccessControlWithSecret(_secret: string) {},
  };
}
