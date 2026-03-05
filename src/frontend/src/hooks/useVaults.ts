import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type AppBackend, type BackendVault, useBackend } from "./useBackend";

// ─── Frontend Vault type ────────────────────────────────────────────────────

export interface Vault {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  creator: string;
  createdAt: Date;
  withdrawn: boolean;
  contributorCount: number;
  contributedByMe: boolean;
}

// ─── Conversion helpers ─────────────────────────────────────────────────────

const nsToDate = (ns: bigint): Date => new Date(Number(ns / 1_000_000n));
const dateToNs = (d: Date): bigint => BigInt(d.getTime()) * 1_000_000n;

function convertVault(raw: BackendVault, contributedByMe = false): Vault {
  return {
    id: Number(raw.id),
    title: raw.title,
    description: raw.description,
    targetAmount: Number(raw.targetAmount),
    currentAmount: Number(raw.currentAmount),
    deadline: nsToDate(raw.deadline),
    creator: raw.creator.toText(),
    createdAt: nsToDate(raw.createdAt),
    withdrawn: raw.withdrawn,
    contributorCount: Number(raw.contributorCount),
    contributedByMe,
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVaults() {
  const { isLoggedIn, getAnonActor, getAuthActor } = useBackend();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which vault IDs we've contributed to this session
  const [contributedIds, setContributedIds] = useState<Set<number>>(new Set());

  const fetchVaults = useCallback(
    async (backend?: AppBackend) => {
      setIsLoading(true);
      setError(null);
      try {
        const actor = backend ?? (await getAnonActor());
        const rawVaults = await actor.getVaults();

        // Sort by createdAt descending
        const sorted = [...rawVaults].sort((a, b) =>
          b.createdAt > a.createdAt ? 1 : -1,
        );

        setVaults((prev) => {
          // Preserve local contributedByMe state
          const prevContributedIds = new Set(
            prev.filter((v) => v.contributedByMe).map((v) => v.id),
          );
          return sorted.map((v) =>
            convertVault(
              v,
              prevContributedIds.has(Number(v.id)) ||
                contributedIds.has(Number(v.id)),
            ),
          );
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Błąd ładowania zbiórek";
        setError(msg);
        toast.error("Błąd ładowania zbiórek", { description: msg });
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getAnonActor, contributedIds],
  );

  // Initial load and when login state changes
  useEffect(() => {
    void fetchVaults();
  }, [fetchVaults]);

  const createVault = useCallback(
    async (
      title: string,
      description: string,
      target: number,
      deadline: Date,
    ) => {
      if (!isLoggedIn || !getAuthActor) {
        toast.error("Zaloguj się, aby utworzyć zbiórkę");
        return;
      }
      setIsMutating(true);
      try {
        const actor = await getAuthActor();
        await actor.createVault(
          title,
          description,
          BigInt(target),
          dateToNs(deadline),
        );
        toast.success("Skarbonka utworzona on-chain", {
          description: "Zbiórkа zapisana w smart kontrakcie ICP.",
        });
        await fetchVaults(actor);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Błąd tworzenia zbiórki";
        toast.error("Błąd tworzenia zbiórki", { description: msg });
      } finally {
        setIsMutating(false);
      }
    },
    [isLoggedIn, getAuthActor, fetchVaults],
  );

  const contribute = useCallback(
    async (vaultId: number, amount: number) => {
      if (!isLoggedIn || !getAuthActor) {
        toast.error("Zaloguj się, aby wpłacić tokeny");
        return;
      }
      setIsMutating(true);
      try {
        const actor = await getAuthActor();
        const success = await actor.contribute(BigInt(vaultId), BigInt(amount));
        if (success) {
          setContributedIds((prev) => new Set([...prev, vaultId]));
          toast.success(`Wpłacono ${amount} ICP`, {
            description: "Transakcja zapisana on-chain.",
          });
          await fetchVaults(actor);
        } else {
          toast.error("Wpłata nie powiodła się", {
            description:
              "Zbiórka może być już zakończona lub wystąpił inny błąd.",
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Błąd wpłaty";
        toast.error("Błąd wpłaty", { description: msg });
      } finally {
        setIsMutating(false);
      }
    },
    [isLoggedIn, getAuthActor, fetchVaults],
  );

  const withdrawVault = useCallback(
    async (vaultId: number) => {
      if (!isLoggedIn || !getAuthActor) {
        toast.error("Zaloguj się, aby wypłacić środki");
        return;
      }
      setIsMutating(true);
      try {
        const actor = await getAuthActor();
        const success = await actor.withdrawVault(BigInt(vaultId));
        if (success) {
          toast.success("Środki wypłacone pomyślnie", {
            description: "Transakcja wykonana na blockchainie ICP.",
          });
          await fetchVaults(actor);
        } else {
          toast.error("Wypłata nie powiodła się", {
            description: "Sprawdź, czy jesteś twórcą i cel został osiągnięty.",
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Błąd wypłaty";
        toast.error("Błąd wypłaty", { description: msg });
      } finally {
        setIsMutating(false);
      }
    },
    [isLoggedIn, getAuthActor, fetchVaults],
  );

  return {
    vaults,
    isLoading,
    isMutating,
    error,
    fetchVaults: () => fetchVaults(),
    createVault,
    contribute,
    withdrawVault,
  };
}
