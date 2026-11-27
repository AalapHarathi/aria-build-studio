import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, AlertTriangle, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Pill, SampleTag, StageBadge } from "@/components/aria/ui";
import { BUNDLES, TEAMMATES, LIFECYCLE, type Stage } from "@/lib/aria-data";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/releases")({ head: () => seo("Bundles & Releases", "Version-pinned bundles, staged rollout, canary, health checks and rollback."), component: Releases });

const TOOLS = [
  { name: "Policy API (sample)", live: true }, { name: "Payments API (sample)", live: true }, { name: "Email MCP (sample)", live: false }, { name: "Risk MCP (sample)", live: true },
];

function Releases() {
  const { role } = useApp();
  const [rels, setRels] = useState(TEAMMATES.filter((t) => ["Approved", "Staged", "Canary", "Production"].includes(t.stage)));
  const [selId, setSelId] = useState(rels[0]!.id);
  const [tools, setTools] = useState(TOOLS);
  const [health, setHealth] = useState<null | boolean>(null);
  const sel = rels.find((r) => r.id === selId)!;
  const idx = LIFECYCLE.indexOf(sel.stage);
  const next = LIFECYCLE[idx + 1] as Stage | undefined;
  const isOp = role === "operator";
  const allLive = tools.every((t) => t.live);
  const blockers = [
    !isOp && "Only Platform Operators can promote releases",
    next === "Canary" && health !== true && "Run a passing health check before canary",
    next === "Production" && !allLive && "All tools must be live before production",
    next === "Production" && health !== true && "Health check must pass before production",
  ].filter(Boolean) as string[];
  const setStage = (s: Stage) => { setRels(rels.map((r) => (r.id === sel.id ? { ...r, stage: s } : r))); setHealth(null); };

  return (
    <div>
      <PageHeader eyebrow="Ship" title="Bundles & Releases" desc="Promote approved Teammates through Staged → Canary → Production. All deployments shown are simulated." actions={<SampleTag>Simulated deployments</SampleTag>} />
      <div className="space-y-6 p-8">
        <Panel title="Aria Core bundles (version-pinned)">
          <div className="grid gap-3 md:grid-cols-3">{BUNDLES.map((b) => <div key={b.id} className="rounded-md border p-3"><div className="flex justify-between"><span className="text-sm font-semibold">{b.name}</span><Pill tone={b.status === "Active" ? "teal" : b.status === "Preview" ? "violet" : "muted"}>{b.status}</Pill></div><div className="mt-2 grid grid-cols-2 gap-x-2 text-xs">{Object.entries(b.pinned).map(([k, v]) => <div key={k} className="contents"><span className="truncate text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>)}</div></div>)}</div>
        </Panel>
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-2">{rels.map((r) => <button key={r.id} onClick={() => { setSelId(r.id); setHealth(null); }} className={cn("w-full rounded-lg border bg-card p-3 text-left", selId === r.id && "border-primary ring-1 ring-primary")}><div className="text-sm font-medium">{r.name}</div><div className="mt-1 flex items-center justify-between"><StageBadge stage={r.stage} /><span className="font-mono text-xs text-muted-foreground">v{r.version}</span></div></button>)}</div>
          <div className="space-y-4">
            <Panel title={`${sel.name} · v${sel.version}`}>
              <div className="flex items-center gap-1">{LIFECYCLE.map((s, i) => <div key={s} className="flex flex-1 flex-col items-center gap-1"><div className={cn("h-1.5 w-full rounded-full", i <= idx ? "bg-teal" : "bg-muted")} /><span className={cn("text-[11px]", i === idx ? "font-semibold" : "text-muted-foreground")}>{s}</span></div>)}</div>
              {sel.stage === "Canary" && <div className="mt-4 rounded-md bg-teal-soft p-3 text-sm text-teal">Canary: 5% of traffic for 24 hours (illustrative). 14h remaining · error rate 0.2% (sample).</div>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => { setHealth(true); toast("Simulated health check passed"); }}>Run health check</Button>
                {next && <Button disabled={blockers.length > 0} onClick={() => { setStage(next); toast.success(`Simulated: promoted to ${next}`); }}>Promote to {next}{next === "Canary" ? " (5% · 24h)" : ""}</Button>}
                {idx > 2 && <Button variant="destructive" disabled={!isOp} onClick={() => { setStage(LIFECYCLE[idx - 1]!); toast.warning(`Simulated rollback to ${LIFECYCLE[idx - 1]}`); }}><RotateCcw className="h-4 w-4" />Roll back</Button>}
              </div>
              {health !== null && <div className="mt-3 flex items-center gap-2 text-sm text-teal"><CheckCircle2 className="h-4 w-4" />Health: latency, error rate, checkpoint reachability, decision-record integrity OK (simulated)</div>}
              {blockers.length > 0 && next && <ul className="mt-3 space-y-1 text-sm">{blockers.map((b) => <li key={b} className="flex items-center gap-2 text-warning">{b.startsWith("Only") ? <Lock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{b}</li>)}</ul>}
            </Panel>
            <Panel title="Tool readiness (required before production)">
              <ul className="divide-y">{tools.map((t, i) => <li key={t.name} className="flex items-center justify-between py-2 text-sm"><span>{t.name}</span>{t.live ? <Pill tone="teal">Live</Pill> : <Button size="sm" variant="outline" disabled={!isOp} onClick={() => setTools(tools.map((x, j) => j === i ? { ...x, live: true } : x))}>Mark live (simulated)</Button>}</li>)}</ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
