import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpRight,
  Blocks,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Loader2,
  Lock,
  LogOut,
  Megaphone,
  PenLine,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useBackend } from "./hooks/useBackend";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { type PostCategory, usePosts } from "./hooks/usePosts";
import { useVaults } from "./hooks/useVaults";

// ── Helpers ───────────────────────────────────────────────────
function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}…${p.slice(-5)}`;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  return `${days} dni temu`;
}

function formatDeadline(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "Zakończono";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Ostatni dzień!";
  return `${days} dni pozostało`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Skeleton loaders ──────────────────────────────────────────
function PostSkeleton() {
  return (
    <div
      data-ocid="board.post.loading_state"
      className="card-gradient rounded-xl p-5 chain-border"
    >
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>
    </div>
  );
}

function VaultSkeleton() {
  return (
    <div
      data-ocid="vault.item.loading_state"
      className="card-gradient rounded-xl p-5 chain-border"
    >
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-4/5 mb-4" />
      <div className="mb-4 rounded-lg bg-muted/30 border border-border/40 p-3">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
import type { Post } from "./hooks/usePosts";
import type { Vault } from "./hooks/useVaults";

interface PostCardProps {
  post: Post;
  index: number;
  isLoggedIn: boolean;
  myPrincipal: string | null;
  isMutating: boolean;
  onSign: (id: number) => void;
}

function PostCard({
  post,
  index,
  isLoggedIn,
  myPrincipal,
  isMutating,
  onSign,
}: PostCardProps) {
  const isOwn = myPrincipal === post.author;
  const canSign = isLoggedIn && !post.signedByMe && !isOwn;

  const ocidIndex = index + 1;
  const borderClass =
    post.category === "Ogłoszenie" ? "chain-border" : "chain-border-accent";

  return (
    <article
      data-ocid={`board.post.item.${ocidIndex}`}
      className={`card-gradient rounded-xl p-5 ${borderClass} group transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {post.category === "Ogłoszenie" ? (
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 text-xs font-medium font-mono gap-1"
            >
              <Megaphone className="w-3 h-3" />
              Ogłoszenie
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-accent/40 text-accent bg-accent/10 text-xs font-medium font-mono gap-1"
            >
              <FileText className="w-3 h-3" />
              Petycja
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground text-xs mono flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(post.createdAt)}
        </span>
      </div>

      <h3 className="font-display font-black text-foreground text-base leading-snug mb-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
        {post.description}
      </p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-primary/70" />
            {truncatePrincipal(post.author)}
          </span>
          <span className="flex items-center gap-1.5 bg-secondary/60 rounded-md px-2 py-0.5 border border-border/40">
            <PenLine className="w-3 h-3 text-primary/70" />
            <span className="font-black text-foreground mono text-xs">
              {post.signatureCount}
            </span>
            <span className="text-muted-foreground">podpisów</span>
          </span>
        </div>

        {post.signedByMe ? (
          <Badge
            variant="outline"
            className="border-chart-3/40 text-chart-3 bg-chart-3/10 text-xs gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            Podpisano
          </Badge>
        ) : (
          <Button
            size="sm"
            variant={canSign ? "default" : "outline"}
            disabled={!canSign || isMutating}
            className={
              canSign
                ? "h-7 text-xs bg-primary/90 hover:bg-primary text-primary-foreground"
                : "h-7 text-xs opacity-50"
            }
            onClick={() => onSign(post.id)}
            data-ocid={`board.sign_button.${ocidIndex}`}
            title={!isLoggedIn ? "Zaloguj się, aby podpisać" : undefined}
          >
            {isMutating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <PenLine className="w-3 h-3 mr-1" />
            )}
            {isOwn ? "Twój post" : "Podpisz"}
          </Button>
        )}
      </div>
    </article>
  );
}

// ── Vault Card ────────────────────────────────────────────────
interface VaultCardProps {
  vault: Vault;
  index: number;
  isLoggedIn: boolean;
  myPrincipal: string | null;
  isMutating: boolean;
  onContribute: (id: number, amount: number) => void;
  onWithdraw: (id: number) => void;
}

function VaultCard({
  vault,
  index,
  isLoggedIn,
  myPrincipal,
  isMutating,
  onContribute,
  onWithdraw,
}: VaultCardProps) {
  const [amount, setAmount] = useState("");
  const ocidIndex = index + 1;
  const percent = Math.min(
    100,
    Math.round((vault.currentAmount / vault.targetAmount) * 100),
  );
  const isCreator = myPrincipal === vault.creator;
  const goalReached = vault.currentAmount >= vault.targetAmount;

  const handleContribute = () => {
    const val = Number.parseInt(amount, 10);
    if (!val || val <= 0) {
      toast.error("Podaj prawidłową kwotę tokenów");
      return;
    }
    onContribute(vault.id, val);
    setAmount("");
  };

  return (
    <article
      data-ocid={`vault.item.${ocidIndex}`}
      className="card-gradient rounded-xl p-5 chain-border group transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-display font-black text-foreground text-base leading-snug group-hover:text-primary transition-colors flex-1">
          {vault.title}
        </h3>
        {vault.withdrawn && (
          <Badge
            variant="outline"
            className="border-chart-3/40 text-chart-3 bg-chart-3/10 text-xs shrink-0 gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            Wypłacono
          </Badge>
        )}
        {goalReached && !vault.withdrawn && (
          <Badge
            variant="outline"
            className="border-primary/40 text-primary bg-primary/10 text-xs shrink-0 gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Cel osiągnięty!
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
        {vault.description}
      </p>

      {/* Progress */}
      <div className="mb-4 rounded-lg bg-muted/30 border border-border/40 p-3">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="font-display font-black text-lg leading-none text-foreground mono">
              {vault.currentAmount.toLocaleString()}
            </span>
            <span className="text-xs text-primary font-semibold mono ml-1">
              ICP
            </span>
          </div>
          <span className="text-xs text-muted-foreground mono">
            cel: {vault.targetAmount.toLocaleString()} ICP
          </span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-muted/60">
          <div
            className={`h-full rounded-full transition-all duration-700 ${!goalReached ? "animate-progress-shimmer" : ""}`}
            style={{
              width: `${percent}%`,
              background: goalReached
                ? "linear-gradient(90deg, oklch(0.73 0.19 145), oklch(0.78 0.18 165))"
                : "linear-gradient(90deg, oklch(0.72 0.18 195), oklch(0.65 0.2 285))",
              boxShadow: goalReached
                ? "0 0 10px oklch(0.73 0.19 145 / 0.6)"
                : "0 0 10px oklch(0.72 0.18 195 / 0.5)",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-semibold text-primary mono">
            {percent}%
          </span>
          <span className="text-xs text-muted-foreground">
            {goalReached ? "✓ Cel osiągnięty" : "w trakcie"}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{vault.contributorCount} wpłacających</span>
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          <span title={formatDate(vault.deadline)}>
            {formatDeadline(vault.deadline)}
          </span>
        </span>
        <span className="flex items-center gap-1 mono">
          <ShieldCheck className="w-3 h-3 text-primary/70" />
          {truncatePrincipal(vault.creator)}
        </span>
      </div>

      {/* Actions */}
      {!vault.withdrawn && (
        <div className="flex items-center gap-2 flex-wrap">
          {!goalReached && (
            <>
              <Input
                type="number"
                min={1}
                placeholder="Tokeny ICP"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 w-28 text-xs mono bg-secondary/50 border-border"
                disabled={!isLoggedIn || vault.contributedByMe || isMutating}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10 hover:border-primary gap-1"
                disabled={!isLoggedIn || vault.contributedByMe || isMutating}
                onClick={handleContribute}
                data-ocid={`vault.contribute_button.${ocidIndex}`}
                title={
                  !isLoggedIn ? "Zaloguj się, aby wpłacić tokeny" : undefined
                }
              >
                {isMutating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Coins className="w-3 h-3" />
                )}
                {vault.contributedByMe ? "Wpłacono" : "Wpłać tokeny"}
              </Button>
            </>
          )}
          {isCreator && goalReached && !vault.withdrawn && (
            <Button
              size="sm"
              className="h-8 text-xs bg-chart-3/90 hover:bg-chart-3 text-primary-foreground gap-1 ml-auto"
              disabled={isMutating}
              onClick={() => onWithdraw(vault.id)}
              data-ocid={`vault.withdraw_button.${ocidIndex}`}
            >
              {isMutating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3 h-3" />
              )}
              Wypłać środki
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

// ── Create Post Dialog ────────────────────────────────────────
interface CreatePostDialogProps {
  isLoggedIn: boolean;
  isMutating: boolean;
  onCreatePost: (title: string, desc: string, cat: PostCategory) => void;
}

function CreatePostDialog({
  isLoggedIn,
  isMutating,
  onCreatePost,
}: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PostCategory>("Ogłoszenie");

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Wypełnij wszystkie pola");
      return;
    }
    onCreatePost(title.trim(), description.trim(), category);
    setTitle("");
    setDescription("");
    setCategory("Ogłoszenie");
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isLoggedIn}
            title={!isLoggedIn ? "Zaloguj się, aby dodać post" : undefined}
            data-ocid="board.add_button"
          >
            {!isLoggedIn ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Dodaj Post
          </Button>
        </DialogTrigger>
        <DialogContent
          className="bg-popover border-border shadow-card max-w-md"
          data-ocid="board.create_post.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <PenLine className="w-5 h-5 text-primary" />
              Nowy wpis on-chain
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Tytuł</Label>
              <Input
                placeholder="Krótki, zwięzły tytuł..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary/50"
                data-ocid="board.post_title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Opis</Label>
              <Textarea
                placeholder="Szczegółowy opis wpisu lub petycji..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-secondary/50 border-border focus:border-primary/50 resize-none"
                data-ocid="board.post_description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Kategoria</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as PostCategory)}
              >
                <SelectTrigger
                  className="bg-secondary/50 border-border"
                  data-ocid="board.post_category.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="Ogłoszenie">Ogłoszenie</SelectItem>
                  <SelectItem value="Petycja">Petycja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-border"
                data-ocid="board.create_post.cancel_button"
              >
                Anuluj
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isMutating}
              className="bg-primary/90 hover:bg-primary text-primary-foreground gap-2"
              data-ocid="board.post_submit.button"
            >
              {isMutating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Blocks className="w-4 h-4" />
              )}
              {isMutating ? "Publikuję..." : "Opublikuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!isLoggedIn && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Wymagane logowanie
        </span>
      )}
    </div>
  );
}

// ── Create Vault Dialog ───────────────────────────────────────
interface CreateVaultDialogProps {
  isLoggedIn: boolean;
  isMutating: boolean;
  onCreateVault: (
    title: string,
    desc: string,
    target: number,
    deadline: Date,
  ) => void;
}

function CreateVaultDialog({
  isLoggedIn,
  isMutating,
  onCreateVault,
}: CreateVaultDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !target || !deadline) {
      toast.error("Wypełnij wszystkie pola");
      return;
    }
    const targetNum = Number.parseInt(target, 10);
    if (targetNum <= 0 || Number.isNaN(targetNum)) {
      toast.error("Podaj prawidłowy cel zbiórki");
      return;
    }
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      toast.error("Termin musi być w przyszłości");
      return;
    }
    onCreateVault(title.trim(), description.trim(), targetNum, deadlineDate);
    setTitle("");
    setDescription("");
    setTarget("");
    setDeadline("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isLoggedIn}
            title={
              !isLoggedIn ? "Zaloguj się, aby utworzyć zbiórkę" : undefined
            }
            data-ocid="vault.add_button"
          >
            {!isLoggedIn ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Utwórz Zbiórkę
          </Button>
        </DialogTrigger>
        <DialogContent
          className="bg-popover border-border shadow-card max-w-md"
          data-ocid="vault.create.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Nowa skarbonka on-chain
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Tytuł</Label>
              <Input
                placeholder="Nazwa zbiórki..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary/50"
                data-ocid="vault.title.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Opis</Label>
              <Textarea
                placeholder="Cel i przeznaczenie zebranych środków..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-secondary/50 border-border focus:border-primary/50 resize-none"
                data-ocid="vault.description.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Cel zbiórki (tokeny ICP)
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="np. 1000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary/50 mono"
                data-ocid="vault.target.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Termin zbiórki
              </Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary/50 mono"
                data-ocid="vault.deadline.input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-border"
                data-ocid="vault.cancel_button"
              >
                Anuluj
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isMutating}
              className="bg-primary/90 hover:bg-primary text-primary-foreground gap-2"
              data-ocid="vault.create_submit.button"
            >
              {isMutating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
              {isMutating ? "Tworzę..." : "Utwórz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!isLoggedIn && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Wymagane logowanie
        </span>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const { login, clear, isLoggingIn, isInitializing } = useInternetIdentity();
  const { isLoggedIn, principal } = useBackend();
  const [postFilter, setPostFilter] = useState<"Wszystkie" | PostCategory>(
    "Wszystkie",
  );
  const [activeTab, setActiveTab] = useState("board");

  const {
    posts,
    isLoading: postsLoading,
    isMutating: postsMutating,
    createPost,
    signPost,
  } = usePosts();

  const {
    vaults,
    isLoading: vaultsLoading,
    isMutating: vaultsMutating,
    createVault,
    contribute,
    withdrawVault,
  } = useVaults();

  const handleLogin = useCallback(() => {
    login();
  }, [login]);

  const handleLogout = useCallback(() => {
    clear();
    toast("Rozłączono portfel");
  }, [clear]);

  const handleSignPost = useCallback(
    (id: number) => {
      void signPost(id);
    },
    [signPost],
  );

  const handleCreatePost = useCallback(
    (title: string, desc: string, cat: PostCategory) => {
      void createPost(title, desc, cat);
    },
    [createPost],
  );

  const handleContribute = useCallback(
    (id: number, amount: number) => {
      void contribute(id, amount);
    },
    [contribute],
  );

  const handleWithdraw = useCallback(
    (id: number) => {
      void withdrawVault(id);
    },
    [withdrawVault],
  );

  const handleCreateVault = useCallback(
    (title: string, desc: string, target: number, deadline: Date) => {
      void createVault(title, desc, target, deadline);
    },
    [createVault],
  );

  const filteredPosts =
    postFilter === "Wszystkie"
      ? posts
      : posts.filter((p) => p.category === postFilter);

  return (
    <div className="min-h-screen bg-background bg-mesh flex flex-col">
      <Toaster richColors position="top-right" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center shadow-[0_0_16px_var(--glow-primary)]">
              <Blocks className="w-5 h-5 text-primary animate-glow-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-black text-xl leading-none tracking-tight text-gradient-primary">
                Decentralized
              </h1>
              <p className="text-xs text-muted-foreground mono leading-tight tracking-widest uppercase mt-0.5">
                Community Board
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="font-display font-black text-lg text-gradient-primary">
                DCB
              </h1>
            </div>
          </div>

          {/* Chain indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mono bg-secondary/60 rounded-full px-3 py-1.5 border border-border/50">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-3 animate-pulse" />
            ICP Mainnet
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs mono text-muted-foreground bg-secondary/60 px-2.5 py-1.5 rounded-lg border border-border/50">
                  <ShieldCheck className="w-3 h-3 text-chart-3" />
                  {truncatePrincipal(principal ?? "")}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-border/70 hover:border-destructive/50 hover:text-destructive gap-1.5"
                  onClick={handleLogout}
                  data-ocid="auth.logout_button"
                >
                  <LogOut className="w-3 h-3" />
                  Wyloguj
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="h-8 text-xs bg-primary/90 hover:bg-primary text-primary-foreground gap-1.5"
                onClick={handleLogin}
                disabled={isLoggingIn || isInitializing}
                data-ocid="auth.login_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wallet className="w-3 h-3" />
                )}
                {isLoggingIn ? "Łączę..." : "Zaloguj się"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero strip ── */}
      <div className="border-b border-border/30 bg-secondary/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            <span className="text-primary font-medium">
              Zdecentralizowana platforma
            </span>{" "}
            do publikowania ogłoszeń, podpisywania petycji i prowadzenia zbiórek
            tokenów. Wszystkie dane zapisywane są nieodwołalnie w canisterach{" "}
            <span className="mono text-primary/80">
              Internet Computer Protocol
            </span>
            .
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab list */}
          <TabsList className="w-full sm:w-auto h-12 bg-secondary/50 border border-border/50 rounded-xl p-1 mb-8 grid grid-cols-2 sm:grid-cols-2 gap-1">
            <TabsTrigger
              value="board"
              className="h-10 rounded-lg text-sm font-semibold font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_16px_var(--glow-primary)] transition-all duration-200 gap-2"
              data-ocid="nav.board_tab"
            >
              <Megaphone className="w-4 h-4" />
              <span>Tablica Ogłoszeń</span>
            </TabsTrigger>
            <TabsTrigger
              value="vault"
              className="h-10 rounded-lg text-sm font-semibold font-display data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_16px_var(--glow-primary)] transition-all duration-200 gap-2"
              data-ocid="nav.vault_tab"
            >
              <Coins className="w-4 h-4" />
              <span>Skarbonka Grupowa</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Board Tab ── */}
          <TabsContent value="board" className="mt-0 animate-fade-slide-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display font-black text-2xl text-foreground leading-tight flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-primary inline-block shrink-0" />
                  Tablica Ogłoszeń
                </h2>
                <p className="text-sm text-muted-foreground mt-1 ml-3.5">
                  Niemodyfikowalne wpisy zapisane w blockchainie ICP
                </p>
              </div>
              <CreatePostDialog
                isLoggedIn={isLoggedIn}
                isMutating={postsMutating}
                onCreatePost={handleCreatePost}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {(["Wszystkie", "Ogłoszenie", "Petycja"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={postFilter === f ? "default" : "outline"}
                  className={
                    postFilter === f
                      ? "h-7 text-xs bg-primary/80 hover:bg-primary text-primary-foreground"
                      : "h-7 text-xs border-border/70 text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }
                  onClick={() => setPostFilter(f)}
                  data-ocid="board.filter.tab"
                >
                  {f === "Wszystkie" && "Wszystkie"}
                  {f === "Ogłoszenie" && (
                    <>
                      <Megaphone className="w-3 h-3 mr-1" />
                      Ogłoszenia
                    </>
                  )}
                  {f === "Petycja" && (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      Petycje
                    </>
                  )}
                </Button>
              ))}
              <span className="text-xs text-muted-foreground ml-auto mono">
                {postsLoading ? "…" : filteredPosts.length} wpisów
              </span>
            </div>

            {/* Post list */}
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div
                data-ocid="board.empty_state"
                className="text-center py-16 rounded-xl border border-dashed border-border/50"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/60 border border-border flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium mb-1">
                  Brak wpisów
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {posts.length === 0
                    ? "Bądź pierwszym, który doda wpis on-chain."
                    : "Żadne wpisy nie pasują do wybranego filtru."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    isLoggedIn={isLoggedIn}
                    myPrincipal={principal}
                    isMutating={postsMutating}
                    onSign={handleSignPost}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Vault Tab ── */}
          <TabsContent value="vault" className="mt-0 animate-fade-slide-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display font-black text-2xl text-foreground leading-tight flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-primary inline-block shrink-0" />
                  Skarbonka Grupowa
                </h2>
                <p className="text-sm text-muted-foreground mt-1 ml-3.5">
                  Przejrzyste zbiórki tokenów ICP zarządzane przez smart
                  kontrakty
                </p>
              </div>
              <CreateVaultDialog
                isLoggedIn={isLoggedIn}
                isMutating={vaultsMutating}
                onCreateVault={handleCreateVault}
              />
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                {
                  label: "Aktywnych zbiórek",
                  value: vaults.filter((v) => !v.withdrawn).length,
                  icon: TrendingUp,
                  color: "text-primary",
                },
                {
                  label: "Łącznie zebrano",
                  value: `${vaults
                    .reduce((acc, v) => acc + v.currentAmount, 0)
                    .toLocaleString()} ICP`,
                  icon: Coins,
                  color: "text-chart-4",
                },
                {
                  label: "Uczestników",
                  value: vaults.reduce((acc, v) => acc + v.contributorCount, 0),
                  icon: Users,
                  color: "text-accent",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="card-gradient rounded-xl p-3 text-center"
                >
                  <div
                    className={`flex items-center justify-center gap-1 ${color} text-xs mb-1.5`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p
                    className={`font-display font-black ${color} mono text-base leading-none mb-1`}
                  >
                    {vaultsLoading ? "…" : value}
                  </p>
                  <p className="text-muted-foreground text-xs">{label}</p>
                </div>
              ))}
            </div>

            {/* Vault list */}
            {vaultsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <VaultSkeleton key={i} />
                ))}
              </div>
            ) : vaults.length === 0 ? (
              <div
                data-ocid="vault.empty_state"
                className="text-center py-16 rounded-xl border border-dashed border-border/50"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/60 border border-border flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium mb-1">
                  Brak zbiórek
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Utwórz pierwszą zbiórkę tokenów dla swojej społeczności.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {vaults.map((vault, i) => (
                  <VaultCard
                    key={vault.id}
                    vault={vault}
                    index={i}
                    isLoggedIn={isLoggedIn}
                    myPrincipal={principal}
                    isMutating={vaultsMutating}
                    onContribute={handleContribute}
                    onWithdraw={handleWithdraw}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-secondary/20 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Blocks className="w-3.5 h-3.5 text-primary/60" />
            <span>
              Dane zapisywane nieodwołalnie na Internet Computer Protocol
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()}. Zbudowane z{" "}
            <span className="text-destructive">♥</span> przy pomocy{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
