import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, SampleTag, StageBadge, Meter } from "@/components/aria/ui";
import { WorkflowBuilder, INITIAL_NODES, INITIAL_EDGES, validate, type WNode } from "@/components/aria/workflow-builder";
import { SECTIONS, BUNDLES, type SectionId } from "@/lib/aria-data";
import { calculateReadiness, readStoredTestResults, type TestResult } from "@/lib/aria-validation";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/teammate-studio")({ head: () => seo("Teammate Studio", "Define a Teammate across 11 structured sections with a visual workflow builder."), component: Studio });

function Studio() {
  const { role } = useApp();
  const [sec, setSec] = useState<SectionId>("workflow");
  const [f, setF] = useState<Record<string, string>>({ name: "Claims Resolution Teammate", outcome: "Resolve motor claims under £5k within 48h", owner: "Claims Operations", responsibilities: "Triage claims\nCheck coverage\nPrepare payouts for approval", instructions: "Never promise payment before approval.", reasoning: "Evidence-first evaluation", knowledge: "", tools: "Policy API (sample), Payments API (sample)", persona: "", tests: "5 golden cases", bundle: BUNDLES[0].id });
  const [nodes, setNodes] = useState<WNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<[string, string][]>(INITIAL_EDGES);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [saved, setSaved] = useState("Saved just now");
  useEffect(() => { setSaved("Saving…"); const t = setTimeout(() => setSaved("All changes autosaved"), 600); return () => clearTimeout(t); }, [f, nodes, edges]);
  useEffect(() => setTestResults(readStoredTestResults("tm-claims")), []);
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const wfBlock = validate(nodes, edges).filter((i) => i.blocking);
  const readiness = calculateReadiness(testResults);
  const reasons: Partial<Record<SectionId, string[]>> = {
    identity: [!f.name && "Name required", !f.outcome && "Business outcome required", !f.owner && "Owning team required"].filter(Boolean) as string[],
    responsibilities: f.responsibilities ? [] : ["List at least one responsibility"],
    instructions: f.instructions ? [] : ["Boundaries required"],
    reasoning: f.reasoning ? [] : ["Select a reasoning policy"],
    tools: f.tools ? [] : ["Declare tools or 'none'"],
    workflow: wfBlock.map((i) => i.msg),
    governance: [],
    testing: [
      ...(testResults.length === 0 ? ["Run deterministic test suites for this Draft"] : []),
      ...(readiness.score !== null && !readiness.meetsThreshold ? [`Readiness ${readiness.score}% is below the ${readiness.threshold}% threshold`] : []),
      ...(wfBlock.length ? ["Testing blocked by workflow validation"] : []),
    ],
    versions: f.bundle ? [] : ["Pin a bundle"],
  };
  const done = (id: SectionId) => { const s = SECTIONS.find((x) => x.id === id)!; return (reasons[id]?.length ?? 0) === 0 && (s.mandatory || !!f[id]); };
  const pct = readiness.score ?? 0;
  const ta = (k: string) => <Textarea value={f[k] ?? ""} onChange={set(k)} className="min-h-28" />;

  const body: Record<SectionId, React.ReactNode> = {
    identity: <div className="grid gap-3 md:grid-cols-2"><div><Label>Name *</Label><Input value={f.name} onChange={set("name")} /></div><div><Label>Owning team *</Label><Input value={f.owner} onChange={set("owner")} /></div><div className="md:col-span-2"><Label>Business outcome owned *</Label><Input value={f.outcome} onChange={set("outcome")} /></div></div>,
    responsibilities: <div><Label>Responsibilities * (one per line)</Label>{ta("responsibilities")}</div>,
    instructions: <div><Label>Instructions and hard boundaries *</Label>{ta("instructions")}</div>,
    reasoning: <div><Label>Cognitive Core reasoning policy *</Label><Select value={f.reasoning} onValueChange={(v) => setF({ ...f, reasoning: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Evidence-first evaluation", "Threshold decisioning", "Conflict resolution order"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>,
    knowledge: <div><Label>Knowledge sources & memory scopes (optional)</Label>{ta("knowledge")}</div>,
    tools: <div><Label>Tools and integrations * (sample registrations only)</Label>{ta("tools")}</div>,
    workflow: <WorkflowBuilder nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />,
    persona: <div><Label>Persona (optional)</Label>{ta("persona")}</div>,
    governance: <div className="space-y-2 text-sm"><div>Autonomy: <Pill tone="blue">Copilot</Pill> <span className="text-muted-foreground">New Teammates start in Copilot; raising autonomy requires approval.</span></div><div className="text-muted-foreground">High-risk actions require human checkpoints. Builder cannot approve own work.</div></div>,
    testing: <div className="space-y-3"><Meter value={pct} threshold={readiness.threshold} /><div className="text-sm">{readiness.score === null ? "No test results for this Draft yet." : `${readiness.passed}/${readiness.total} cases passed · ${readiness.score}% readiness.`}</div><div className="text-xs text-muted-foreground">Readiness uses deterministic test results, hard-rule coverage, and checkpoint coverage. Configured threshold: {readiness.threshold}%.</div><Button asChild size="sm" variant="outline"><Link to="/testing">Open Testing & Evaluation</Link></Button></div>,
    versions: <div className="space-y-2"><Label>Pinned Aria Core bundle *</Label><Select value={f.bundle} onValueChange={(v) => setF({ ...f, bundle: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BUNDLES.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select><div className="text-sm">Version 0.4.0-draft · <StageBadge stage="Draft" /></div></div>,
  };
  const sectionBlockers = SECTIONS.flatMap((s) => s.mandatory ? (reasons[s.id] ?? []).map((reason) => `${s.title}: ${reason}`) : []);
  const submissionBlockers = [
    ...(role !== "builder" ? ["Only a Builder can submit this Draft"] : []),
    ...sectionBlockers,
    ...(wfBlock.length ? wfBlock.map((i) => i.msg) : []),
  ];
  const allOk = submissionBlockers.length === 0;

  return (
    <div>
      <PageHeader eyebrow="Build · Teammate Studio" title={f.name || "Untitled Teammate"} desc="Structured, deterministic definition. Creation produces a Draft only."
        actions={<><SampleTag /><StageBadge stage="Draft" /><span className="flex items-center gap-1 text-xs text-muted-foreground"><Save className="h-3.5 w-3.5" />{saved}</span>
          <Button disabled={!allOk} title={submissionBlockers.join(" · ")} onClick={() => toast.success("Submitted for review (simulated)")}>Submit for review</Button></>} />
      <div className="grid gap-6 p-8 xl:grid-cols-[260px_1fr]">
        <div className="space-y-1">
          <div className="mb-3 space-y-1"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Readiness</span><span>{readiness.score === null ? "Not run" : `${readiness.score}%`}</span></div><Meter value={pct} threshold={readiness.threshold} /><div className="text-[10px] text-muted-foreground">Threshold {readiness.threshold}%</div></div>
          {!allOk && <div role="status" className="mb-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-xs"><div className="font-semibold">Submission disabled</div><ul className="mt-1 space-y-1">{submissionBlockers.map((reason) => <li key={reason}>• {reason}</li>)}</ul>{testResults.length === 0 && <Button asChild size="sm" variant="link" className="mt-1 h-auto p-0"><Link to="/testing">Run test suites</Link></Button>}</div>}
          {SECTIONS.map((s, i) => { const r = reasons[s.id] ?? []; return (
            <button key={s.id} onClick={() => setSec(s.id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", sec === s.id ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>
              {r.length ? <AlertTriangle className="h-4 w-4 text-destructive" /> : done(s.id) ? <CheckCircle2 className="h-4 w-4 text-teal" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className="flex-1">{i + 1}. {s.title}</span><span className="text-[10px] text-muted-foreground">{s.mandatory ? "Req" : "Opt"}</span>
            </button>); })}
        </div>
        <Panel title={SECTIONS.find((s) => s.id === sec)!.title}>
          {(reasons[sec]?.length ?? 0) > 0 && <ul className="mb-3 rounded-md bg-danger-soft p-3 text-xs text-destructive">{reasons[sec]!.map((r) => <li key={r}>⛔ {r}</li>)}</ul>}
          {body[sec]}
        </Panel>
      </div>
    </div>
  );
}
