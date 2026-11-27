import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Pill, SampleTag, Stat } from "@/components/aria/ui";
import { BUNDLES, ENGINES } from "@/lib/aria-data";
import { seo } from "@/lib/seo";

type Row = { name: string; detail: string; scope: string; on: boolean };
const CONTENT: Record<string, { purpose: string; stats: [string, string][]; tabs: { label: string; rows: Row[] }[] }> = {
  "cognitive-core": { purpose: "Deterministic reasoning policies and decision records. Every external action must reference a Cognitive Core decision record capturing inputs, rules evaluated and outcome.", stats: [["Reasoning policies", "14"], ["Decision templates", "3"], ["Records (sample, 7d)", "12,480"], ["External actions unrecorded", "0"]],
    tabs: [{ label: "Reasoning policies", rows: [
      { name: "Evidence-first evaluation", detail: "Evaluate all required inputs before any conclusion", scope: "All Teammates", on: true },
      { name: "Threshold decisioning", detail: "Numeric thresholds resolve before discretionary rules", scope: "Finance", on: true },
      { name: "Conflict resolution order", detail: "Hard rule > policy > preference", scope: "All Teammates", on: true }]},
      { label: "Decision record templates", rows: [
      { name: "External action record", detail: "Inputs, rules evaluated, outcome, approver", scope: "Required for MCP/API writes", on: true },
      { name: "Escalation record", detail: "Trigger, route, SLA", scope: "Escalations", on: true },
      { name: "Abstain record", detail: "Missing inputs and reason", scope: "All", on: false }]}] },
  "motivation-engine": { purpose: "Explicit goals, priorities and outcome KPIs owned by Teammates. Goals are declared, never inferred.", stats: [["Goal definitions", "22"], ["Priority schemes", "6"], ["Outcome KPIs", "8"], ["Conflicting goals", "0"]],
    tabs: [{ label: "Goals", rows: [
      { name: "Resolve within SLA", detail: "Target: 48h · weight 0.5", scope: "Claims", on: true },
      { name: "Zero policy breaches", detail: "Hard constraint", scope: "All", on: true },
      { name: "Minimise handoffs", detail: "Target ≤ 2 · weight 0.2", scope: "Service", on: true }]},
      { label: "Priority schemes", rows: [
      { name: "Risk-weighted queue", detail: "High risk first, then age", scope: "Claims", on: true },
      { name: "FIFO", detail: "Strict arrival order", scope: "AP", on: false }]}] },
  "knowledge-fabric": { purpose: "Curated, versioned knowledge sources and memory scopes. Retrieval returns cited passages only from approved sources.", stats: [["Sources", "31"], ["Memory scopes", "4"], ["Freshness", "98.2%"], ["Unapproved sources", "0"]],
    tabs: [{ label: "Sources", rows: [
      { name: "Motor Policy Wording v12", detail: "PDF · 412 passages · refreshed daily", scope: "Claims", on: true },
      { name: "KYC Procedures 2026", detail: "Wiki · 88 pages", scope: "Onboarding", on: true },
      { name: "Supplier Register", detail: "Table · sample connector", scope: "Procurement", on: true }]},
      { label: "Memory scopes", rows: [
      { name: "Case memory", detail: "Retained for case lifetime", scope: "Per case", on: true },
      { name: "Customer memory", detail: "90 days, PII-redacted", scope: "Per customer", on: true },
      { name: "Session memory", detail: "Cleared on close", scope: "Per session", on: true }]}] },
  "swarm-orchestrator": { purpose: "Delegation of work from Teammates to reusable Taskmates through explicit, versioned workflows.", stats: [["Taskmates", "47"], ["Workflow templates", "12"], ["Avg. delegation depth", "2.1"], ["Unresolved handoffs", "0"]],
    tabs: [{ label: "Delegation policies", rows: [
      { name: "Max depth 3", detail: "Taskmates cannot delegate beyond depth 3", scope: "All", on: true },
      { name: "Parallel fan-out ≤ 4", detail: "Limit concurrent branches", scope: "All", on: true }]},
      { label: "Workflow templates", rows: [
      { name: "Intake → Check → Decide", detail: "Linear 3-stage", scope: "Claims, AP", on: true },
      { name: "Parallel verification", detail: "Fan-out / merge", scope: "KYC", on: true }]}] },
  "anthropomorphic-interface": { purpose: "Persona, tone and channel presentation. Templates are deterministic; persona never alters decisions.", stats: [["Personas", "9"], ["Channels", "4"], ["Accessibility profiles", "3"], ["Locales", "6"]],
    tabs: [{ label: "Personas", rows: [
      { name: "Professional & warm", detail: "Formality 4/5 · empathy 4/5", scope: "Service", on: true },
      { name: "Clinical & precise", detail: "Formality 5/5", scope: "Healthcare", on: true }]},
      { label: "Channels", rows: [
      { name: "Web workspace", detail: "Embedded panel", scope: "Internal", on: true },
      { name: "Email (sample)", detail: "Templated only", scope: "Customer", on: true },
      { name: "Teams (sample)", detail: "Notifications", scope: "Internal", on: false }]}] },
  "governance-sentinel": { purpose: "Hard rules, autonomy levels, human checkpoint policies and audit. High-risk actions always require a checkpoint.", stats: [["Hard rules", "58"], ["Checkpoint policies", "11"], ["Open violations", "0"], ["Audit retention", "7 yrs"]],
    tabs: [{ label: "Hard rules", rows: [
      { name: "HR-01 No payout > £5,000 without approval", detail: "Blocks action, requires checkpoint", scope: "Finance", on: true },
      { name: "HR-02 No PII in external messages", detail: "Redact or block", scope: "All", on: true },
      { name: "HR-03 Builder cannot approve own work", detail: "Separation of duties", scope: "Studio", on: true }]},
      { label: "Autonomy levels", rows: [
      { name: "Copilot", detail: "All actions proposed to a human", scope: "Default for new Teammates", on: true },
      { name: "Supervised", detail: "Low-risk auto; medium/high checkpointed", scope: "After approval", on: true },
      { name: "Autonomous", detail: "Low & medium auto; high checkpointed", scope: "Restricted", on: false }]}] },
};

export const Route = createFileRoute("/core/$engine")({
  loader: ({ params }) => {
    const e = ENGINES.find((x) => x.slug === params.engine);
    if (!e) throw notFound();
    return { slug: e.slug };
  },
  head: ({ loaderData }) => {
    const e = ENGINES.find((x) => x.slug === loaderData?.slug);
    return seo(e?.name ?? "Aria Core", e ? `${e.name}: ${e.short}.` : "Aria Core engine");
  },
  component: EnginePage,
});

function EnginePage() {
  const { slug } = Route.useLoaderData();
  const e = ENGINES.find((x) => x.slug === slug)!;
  const c = CONTENT[slug]!;
  const [rows, setRows] = useState(c.tabs.map((t) => t.rows));
  return (
    <div key={slug}>
      <PageHeader eyebrow="Aria Core" title={e.name} desc={c.purpose} actions={<><SampleTag /><Pill tone="blue">Pinned v{BUNDLES[0].pinned[e.name]}</Pill></>} />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{c.stats.map(([l, v]) => <Stat key={l} label={l} value={v} />)}</div>
        <Tabs defaultValue="0">
          <TabsList>{c.tabs.map((t, i) => <TabsTrigger key={t.label} value={String(i)}>{t.label}</TabsTrigger>)}<TabsTrigger value="versions">Bundle versions</TabsTrigger></TabsList>
          {c.tabs.map((t, i) => (
            <TabsContent key={t.label} value={String(i)}>
              <Panel title={t.label} action={<Button size="sm" variant="outline" onClick={() => toast("Simulated: new entry form opened")}>Add</Button>}>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Name</th><th className="pb-2">Definition</th><th className="pb-2">Scope</th><th className="pb-2 text-right">Enabled</th></tr></thead>
                  <tbody className="divide-y">
                    {rows[i]!.map((r, j) => (
                      <tr key={r.name}><td className="py-2.5 font-medium">{r.name}</td><td className="text-muted-foreground">{r.detail}</td><td><Pill>{r.scope}</Pill></td>
                        <td className="text-right"><Switch checked={r.on} onCheckedChange={(v) => { setRows((p) => p.map((tab, ti) => ti !== i ? tab : tab.map((x, xj) => xj === j ? { ...x, on: v } : x))); toast(`Simulated: ${r.name} ${v ? "enabled" : "disabled"} in draft config`); }} /></td></tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </TabsContent>
          ))}
          <TabsContent value="versions">
            <Panel title="Version per bundle">
              <div className="grid gap-3 md:grid-cols-3">{BUNDLES.map((b) => <div key={b.id} className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{b.name}</div><div className="font-mono text-lg">{b.pinned[e.name]}</div><Pill tone={b.status === "Active" ? "teal" : b.status === "Preview" ? "violet" : "muted"}>{b.status}</Pill></div>)}</div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
