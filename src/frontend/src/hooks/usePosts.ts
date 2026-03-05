import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type AppBackend, type BackendPost, useBackend } from "./useBackend";

// ─── Frontend Post type ─────────────────────────────────────────────────────

export type PostCategory = "Ogłoszenie" | "Petycja";

export interface Post {
  id: number;
  title: string;
  description: string;
  category: PostCategory;
  author: string;
  createdAt: Date;
  signatureCount: number;
  signedByMe: boolean;
}

// ─── Conversion helpers ─────────────────────────────────────────────────────

const nsToDate = (ns: bigint): Date => new Date(Number(ns / 1_000_000n));

function convertPost(raw: BackendPost, signedByMe = false): Post {
  const category: PostCategory =
    "Announcement" in raw.category ? "Ogłoszenie" : "Petycja";
  return {
    id: Number(raw.id),
    title: raw.title,
    description: raw.description,
    category,
    author: raw.author.toText(),
    createdAt: nsToDate(raw.createdAt),
    signatureCount: Number(raw.signatureCount),
    signedByMe,
  };
}

function polishToVariant(cat: PostCategory) {
  return cat === "Ogłoszenie"
    ? { Announcement: null as null }
    : { Petition: null as null };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePosts() {
  const { isLoggedIn, principal, getAnonActor, getAuthActor } = useBackend();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already fetched signatures for the current principal
  const signaturesFetchedRef = useRef<string | null>(null);

  const fetchPosts = useCallback(
    async (backend?: AppBackend) => {
      setIsLoading(true);
      setError(null);
      try {
        const actor = backend ?? (await getAnonActor());
        const rawPosts = await actor.getPosts();

        // Sort by createdAt descending (newest first)
        const sorted = [...rawPosts].sort((a, b) =>
          b.createdAt > a.createdAt ? 1 : -1,
        );

        // If logged in, fetch signature status for each post
        if (
          isLoggedIn &&
          getAuthActor &&
          principal !== signaturesFetchedRef.current
        ) {
          signaturesFetchedRef.current = principal;
          const authActor = await getAuthActor();
          const signedFlags = await Promise.all(
            sorted.map((p) => authActor.hasSignedPost(p.id)),
          );
          setPosts(sorted.map((p, i) => convertPost(p, signedFlags[i])));
        } else {
          setPosts(sorted.map((p) => convertPost(p, false)));
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Błąd ładowania postów";
        setError(msg);
        toast.error("Błąd ładowania postów", { description: msg });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoggedIn, principal, getAuthActor, getAnonActor],
  );

  // Initial load and when login state changes
  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const createPost = useCallback(
    async (title: string, description: string, category: PostCategory) => {
      if (!isLoggedIn || !getAuthActor) {
        toast.error("Zaloguj się, aby dodać post");
        return;
      }
      setIsMutating(true);
      try {
        const actor = await getAuthActor();
        await actor.createPost(title, description, polishToVariant(category));
        toast.success("Post opublikowany on-chain", {
          description: "Wpis został trwale zapisany w blockchainie ICP.",
        });
        await fetchPosts(actor);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Błąd tworzenia postu";
        toast.error("Błąd tworzenia postu", { description: msg });
      } finally {
        setIsMutating(false);
      }
    },
    [isLoggedIn, getAuthActor, fetchPosts],
  );

  const signPost = useCallback(
    async (postId: number) => {
      if (!isLoggedIn || !getAuthActor) {
        toast.error("Zaloguj się, aby podpisać petycję");
        return;
      }
      setIsMutating(true);
      try {
        const actor = await getAuthActor();
        const success = await actor.signPost(BigInt(postId));
        if (success) {
          toast.success("Podpis zarejestrowany on-chain", {
            description: "Twój podpis został trwale zapisany w blockchainie.",
          });
          await fetchPosts(actor);
        } else {
          toast.error("Nie można podpisać", {
            description:
              "Podpis nie powiódł się — być może już podpisałeś lub jesteś autorem.",
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Błąd podpisywania";
        toast.error("Błąd podpisywania", { description: msg });
      } finally {
        setIsMutating(false);
      }
    },
    [isLoggedIn, getAuthActor, fetchPosts],
  );

  return {
    posts,
    isLoading,
    isMutating,
    error,
    fetchPosts: () => fetchPosts(),
    createPost,
    signPost,
  };
}
