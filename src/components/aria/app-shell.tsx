import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Boxes,
  Brain,
  ChevronDown,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  Library,
  Menu,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Smile,
  Sun,
  Target,
  Users,
  Workflow,
  BookOpen,
  Plug,
  ScrollText,
  X,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import {
  ENGINES,
  REVIEWS,
  ROLES,
  SAMPLE_WORKSPACES,
  TASKMATES,
  TEAMMATES,
  type Role,
  type WorkspaceId,
} from "@/lib/aria-data";
import { readStoredTestResults, readStoredWorkflow, type TestResult } from "@/lib/aria-validation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

type Item = { to: string; label: string; icon: typeof Users };
function isInWorkspace(workspace: WorkspaceId, teammateId: string) {
  if (workspace === "all") return true;
  return !!SAMPLE_WORKSPACES.find((item) => item.id === workspace)?.teammateIds?.includes(
    teammateId,
  );
}
const groups: { label: string; items: Item[] }[] = [
  {
    label: "Build",
    items: [
      { to: "/", label: "Studio Overview", icon: LayoutDashboard },
      { to: "/teammate-studio", label: "Teammate Studio", icon: Users },
      { to: "/taskmate-studio", label: "Taskmate Studio", icon: Boxes },
      { to: "/teammate-studio", label: "Workflow Builder", icon: Workflow },
    ],
  },
  {
    label: "Aria Core",
    items: [
      { to: "/core/cognitive-core", label: "Cognitive Core", icon: Brain },
      { to: "/core/motivation-engine", label: "Motivation Engine", icon: Target },
      { to: "/core/knowledge-fabric", label: "Knowledge Fabric", icon: Library },
      { to: "/core/swarm-orchestrator", label: "Swarm Orchestrator", icon: Network },
      { to: "/core/anthropomorphic-interface", label: "Anthropomorphic Interface", icon: Smile },
      { to: "/core/governance-sentinel", label: "Governance Sentinel", icon: ShieldCheck },
    ],
  },
  {
    label: "Ship",
    items: [
      { to: "/testing", label: "Testing & Evaluation", icon: FlaskConical },
      { to: "/reviews", label: "Reviews", icon: ClipboardCheck },
      { to: "/releases", label: "Releases", icon: Rocket },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/releases", label: "Domain Bundles", icon: BookOpen },
      { to: "/control-centre", label: "Integrations", icon: Plug },
      { to: "/control-centre", label: "Audit Ledger", icon: ScrollText },
    ],
  },
];
const external: Item[] = [
  { to: "/operate", label: "Operate", icon: Activity },
  { to: "/control-centre", label: "Control Centre", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { role, setRole, theme, toggleTheme, workspace, setWorkspace } = useApp();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  useEffect(() => setTestResults(readStoredTestResults("tm-claims")), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const failed = isInWorkspace(workspace, "tm-claims")
    ? testResults.filter((r) => r.status === "failed")
    : [];
  const pendingReviews = REVIEWS.filter(
    (review) =>
      review.status === "Awaiting review" &&
      ((role === "reviewer" && review.assignee === ROLES[role].person) ||
        (role === "builder" && review.author === ROLES[role].person)) &&
      (workspace === "all" ||
        TEAMMATES.some(
          (teammate) => teammate.name === review.teammate && isInWorkspace(workspace, teammate.id),
        )),
  );
  const pendingCount = pendingReviews.length + failed.length;
  const searchItems = useMemo(
    () => [
      ...TEAMMATES.filter((x) => isInWorkspace(workspace, x.id)).map((x) => ({
        label: x.name,
        detail: `Teammate · ${x.stage} · ${x.id}`,
        to: "/teammate-studio",
        keywords: `${x.name} ${x.id} ${x.outcome}`,
      })),
      ...TASKMATES.map((x) => ({
        label: x.name,
        detail: `Taskmate · v${x.version} · ${x.id}`,
        to: "/taskmate-studio",
        keywords: `${x.name} ${x.id} ${x.purpose}`,
      })),
      ...ENGINES.map((x) => ({
        label: x.name,
        detail: `Aria Core engine · ${x.short}`,
        to: `/core/${x.slug}`,
        keywords: `${x.name} ${x.short}`,
      })),
      ...REVIEWS.filter(
        (x) =>
          workspace === "all" ||
          TEAMMATES.some(
            (teammate) => teammate.name === x.teammate && isInWorkspace(workspace, teammate.id),
          ),
      ).map((x) => ({
        label: `${x.id} · ${x.title}`,
        detail: `Review · ${x.status}`,
        to: "/reviews",
        keywords: `${x.id} ${x.title} ${x.teammate} ${x.author}`,
      })),
      ...TEAMMATES.filter(
        (x) =>
          isInWorkspace(workspace, x.id) &&
          ["Approved", "Staged", "Canary", "Production"].includes(x.stage),
      ).map((x) => ({
        label: `${x.name} release`,
        detail: `Release · ${x.stage} · ${x.version}`,
        to: "/releases",
        keywords: `${x.name} ${x.stage} ${x.version} release`,
      })),
      ...TEAMMATES.filter((teammate) => isInWorkspace(workspace, teammate.id)).flatMap(
        (teammate) =>
          readStoredWorkflow(teammate.id)?.nodes.flatMap((node) =>
            node.rules.map((rule) => ({
              label: rule.field,
              detail: `Workflow rule · ${teammate.name} · ${rule.op} ${rule.value}`,
              to: "/teammate-studio",
              keywords: `${rule.field} ${rule.op} ${rule.value} ${rule.then}`,
            })),
          ) ?? [],
      ),
      {
        label: "Knowledge sources",
        detail: "Knowledge Fabric · source registry unavailable",
        to: "/core/knowledge-fabric",
        keywords: "knowledge sources provenance retrieval",
      },
      {
        label: "Review queue",
        detail: "Reviews and decisions",
        to: "/reviews",
        keywords: "review approvals",
      },
      {
        label: "Testing & Evaluation",
        detail: "Cases, readiness and traces",
        to: "/testing",
        keywords: "tests rules checks",
      },
      {
        label: "Bundles & Releases",
        detail: "Bundle and release lifecycle",
        to: "/releases",
        keywords: "bundle release deployment",
      },
      {
        label: "Control Centre",
        detail: "Integrations and governance",
        to: "/control-centre",
        keywords: "tools integrations governance audit",
      },
    ],
    [workspace],
  );
  const r = ROLES[role];
  const renderItem = (it: Item, closeMobile = false) => (
    <Link
      key={`${it.label}-${it.to}`}
      to={it.to as "/"}
      title={collapsed ? it.label : undefined}
      onClick={() => closeMobile && setMobileNav(false)}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
        active(it.to)
          ? "bg-shell-active font-medium text-shell-foreground"
          : "text-shell-muted hover:bg-shell-active/60 hover:text-shell-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <it.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{it.label}</span>}
    </Link>
  );
  const sidebar = (mobile = false) => (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-shell text-shell-foreground",
        !mobile && "sticky top-0 hidden h-screen transition-all md:flex",
        !mobile && (collapsed ? "w-14" : "w-60"),
        mobile && "w-72",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b border-shell-active px-3",
          collapsed && !mobile && "justify-center",
        )}
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          A
        </div>
        {(!collapsed || mobile) && (
          <div className="leading-tight">
            <div className="text-sm font-semibold">ARIA XAI</div>
            <div className="text-[11px] text-shell-muted">Build Studio</div>
          </div>
        )}
        {mobile && (
          <button
            onClick={() => setMobileNav(false)}
            className="ml-auto rounded p-1 text-shell-muted"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-3 overflow-y-auto p-2">
        {groups.map((g) => (
          <div key={g.label}>
            {(!collapsed || mobile) && (
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-shell-muted">
                {g.label}
              </div>
            )}
            <div className="space-y-0.5">{g.items.map((i) => renderItem(i, mobile))}</div>
          </div>
        ))}
        <div className="border-t border-shell-active pt-3">
          {(!collapsed || mobile) && (
            <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-shell-muted">
              Other destinations
            </div>
          )}
          <div className="space-y-0.5">{external.map((i) => renderItem(i, mobile))}</div>
        </div>
      </nav>
      {!mobile && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className={cn(
            "flex items-center gap-2 border-t border-shell-active px-4 py-3 text-xs text-shell-muted hover:text-shell-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      )}
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full">
      {sidebar()}
      {mobileNav && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileNav(false)}
        >
          <div className="h-full" onClick={(e) => e.stopPropagation()}>
            {sidebar(true)}
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-2 border-b bg-card/95 px-3 py-2 backdrop-blur sm:px-5 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Select value="sandbox">
              <SelectTrigger className="h-9 w-[130px]" aria-label="Environment">
                <span className="mr-1 h-2 w-2 rounded-full bg-cyan-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="staging" disabled>
                  Staging · unavailable
                </SelectItem>
                <SelectItem value="production" disabled>
                  Production · unavailable
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={workspace} onValueChange={(v) => setWorkspace(v as typeof workspace)}>
              <SelectTrigger className="h-9 w-[190px] max-sm:w-[150px]" aria-label="Workspace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_WORKSPACES.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden min-w-[180px] flex-1 items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm text-muted-foreground md:flex"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate">Search Teammates, Taskmates, rules…</span>
            <kbd className="rounded border px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span className="hidden rounded border border-dashed px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground lg:inline">
              Sandbox · sample data
            </span>
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-md border hover:bg-muted"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label={`Notifications${pendingCount ? `, ${pendingCount} items` : ""}`}
                  className="relative grid h-9 w-9 place-items-center rounded-md border hover:bg-muted"
                >
                  <Bell className="h-4 w-4" />
                  {pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="mb-2 flex items-center justify-between">
                  <strong className="text-sm">Notifications</strong>
                  <span className="text-[10px] text-muted-foreground">Sample workspace</span>
                </div>
                <div className="space-y-2">
                  {pendingReviews.map((review) => (
                    <Link
                      key={review.id}
                      className="block rounded-md border p-2 text-sm hover:bg-muted"
                      to="/reviews"
                    >
                      <span className="font-medium">{review.id} · review awaiting decision</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {review.title} · Open Review Queue
                      </span>
                    </Link>
                  ))}
                  {failed.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      className="block rounded-md border p-2 text-sm hover:bg-muted"
                      to="/testing"
                    >
                      <span className="font-medium">
                        {item.id}: {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Failed check · inspect trace
                      </span>
                    </Link>
                  ))}
                  {pendingCount === 0 && (
                    <p className="py-3 text-sm text-muted-foreground">No sample notifications.</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-muted"
                aria-label="Switch role"
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground">
                  {r.initials}
                </div>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-xs font-medium">{r.person}</div>
                  <div className="text-[11px] text-muted-foreground">{r.label}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Switch role experience</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(ROLES) as Role[]).map((k) => (
                  <DropdownMenuItem
                    key={k}
                    onClick={() => setRole(k)}
                    className={cn("flex-col items-start gap-0", role === k && "bg-accent")}
                  >
                    <span className="text-sm font-medium">
                      {ROLES[k].label} · {ROLES[k].person}
                    </span>
                    <span className="text-xs text-muted-foreground">{ROLES[k].blurb}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground md:hidden"
          >
            <Search className="h-3.5 w-3.5" />
            Search workspace…
          </button>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <Command>
          <CommandInput placeholder="Search Teammates, Taskmates, engines, reviews…" />
          <CommandList>
            <CommandEmpty>No matching records found.</CommandEmpty>
            {searchItems.map((item) => (
              <CommandItem
                key={`${item.label}-${item.to}`}
                value={`${item.label} ${item.detail} ${item.keywords}`}
                onSelect={() => {
                  setSearchOpen(false);
                  void navigate({ to: item.to as "/" });
                }}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{item.detail}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
