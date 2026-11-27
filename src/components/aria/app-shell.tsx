import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, Boxes, Brain, Target, Library, Network, Smile, ShieldCheck,
  FlaskConical, ClipboardCheck, Rocket, Activity, Settings2, Moon, Sun, PanelLeftClose, PanelLeftOpen, Bell, Search, ChevronDown,
} from "lucide-react";
import { useApp } from "@/lib/app-state";
import { ROLES, type Role } from "@/lib/aria-data";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Item = { to: string; label: string; icon: typeof Users; params?: Record<string, string> };
const groups: { label: string; items: Item[] }[] = [
  { label: "Build", items: [
    { to: "/", label: "Studio Overview", icon: LayoutDashboard },
    { to: "/teammate-studio", label: "Teammate Studio", icon: Users },
    { to: "/taskmate-studio", label: "Taskmate Studio", icon: Boxes },
  ]},
  { label: "Aria Core", items: [
    { to: "/core/cognitive-core", label: "Cognitive Core", icon: Brain },
    { to: "/core/motivation-engine", label: "Motivation Engine", icon: Target },
    { to: "/core/knowledge-fabric", label: "Knowledge Fabric", icon: Library },
    { to: "/core/swarm-orchestrator", label: "Swarm Orchestrator", icon: Network },
    { to: "/core/anthropomorphic-interface", label: "Anthropomorphic Interface", icon: Smile },
    { to: "/core/governance-sentinel", label: "Governance Sentinel", icon: ShieldCheck },
  ]},
  { label: "Ship", items: [
    { to: "/testing", label: "Testing & Evaluation", icon: FlaskConical },
    { to: "/reviews", label: "Review Queue", icon: ClipboardCheck },
    { to: "/releases", label: "Bundles & Releases", icon: Rocket },
  ]},
];
const external: Item[] = [
  { to: "/operate", label: "Operate", icon: Activity },
  { to: "/control-centre", label: "Control Centre", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { role, setRole, theme, toggleTheme } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  const renderItem = (it: Item) => (
    <Link
      key={it.to}
      to={it.to as "/"}
      title={collapsed ? it.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
        active(it.to) ? "bg-shell-active font-medium text-shell-foreground" : "text-shell-muted hover:bg-shell-active/60 hover:text-shell-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <it.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{it.label}</span>}
    </Link>
  );

  const r = ROLES[role];
  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("sticky top-0 flex h-screen shrink-0 flex-col bg-shell text-shell-foreground transition-all", collapsed ? "w-14" : "w-60")}>
        <div className={cn("flex h-14 items-center gap-2 border-b border-shell-active px-3", collapsed && "justify-center")}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">A</div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">ARIA XAI</div>
              <div className="text-[11px] text-shell-muted">Build Studio</div>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {groups.map((g) => (
            <div key={g.label}>
              {!collapsed && <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-shell-muted">{g.label}</div>}
              <div className="space-y-0.5">{g.items.map(renderItem)}</div>
            </div>
          ))}
          <div className="border-t border-shell-active pt-3">
            {!collapsed && <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-shell-muted">Other destinations</div>}
            <div className="space-y-0.5">{external.map(renderItem)}</div>
          </div>
        </nav>
        <button onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 border-t border-shell-active px-4 py-3 text-xs text-shell-muted hover:text-shell-foreground">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Collapse</>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-6 backdrop-blur">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> <span>Search Teammates, Taskmates, rules…</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded border border-dashed px-2 py-1 text-[11px] font-medium text-muted-foreground lg:inline">Prototype · sample data · simulated actions</span>
            <span className="hidden items-center gap-1 rounded-md bg-blue-soft px-2 py-1 text-xs font-medium text-primary md:inline-flex">Bundle aria-2026.11</span>
            <button aria-label="Toggle theme" onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-md border hover:bg-muted">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-md border hover:bg-muted">
              <Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-muted" aria-label="Switch role">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[11px] font-semibold text-navy-foreground">{r.initials}</div>
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
                  <DropdownMenuItem key={k} onClick={() => setRole(k)} className={cn("flex-col items-start gap-0", role === k && "bg-accent")}>
                    <span className="text-sm font-medium">{ROLES[k].label} · {ROLES[k].person}</span>
                    <span className="text-xs text-muted-foreground">{ROLES[k].blurb}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
