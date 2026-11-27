import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, RiskPill, SampleTag } from "@/components/aria/ui";
import { TASKMATES, type Taskmate } from "@/lib/aria-data";
import { useApp } from "@/lib/app-state";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/taskmate-studio")({ head: () => seo("Taskmate Studio", "Build and version reusable Taskmates with explicit inputs, outputs and risk."), component: TaskmateStudio });

function TaskmateStudio() {
  const { role } = useApp();
  const [list, setList] = useState<Taskmate[]>(TASKMATES);
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [sel, setSel] = useState<Taskmate | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", purpose: "", inputs: "", outputs: "", risk: "Low" as Taskmate["risk"] });
  const filtered = useMemo(() => list.filter((t) => (risk === "all" || t.risk === risk) && t.name.toLowerCase().includes(q.toLowerCase())), [list, q, risk]);
  const errs = [!draft.name && "Name is required", !draft.purpose && "Purpose is required", !draft.inputs && "At least one input is required", !draft.outputs && "At least one output is required"].filter(Boolean) as string[];

  return (
    <div>
      <PageHeader eyebrow="Build" title="Taskmate Studio" desc="Reusable, versioned units of work that Teammates delegate to. Every Taskmate declares explicit inputs, outputs, risk and tools."
        actions={<><SampleTag />{role === "builder" && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Custom Taskmate</Button>}</>} />
      <div className="space-y-4 p-8">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Filter Taskmates" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Select value={risk} onValueChange={setRisk}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All risk levels</SelectItem><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setSel(t)} className="rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary">
              <div className="flex items-start justify-between gap-2"><div className="font-semibold">{t.name}</div><span className="font-mono text-xs text-muted-foreground">v{t.version}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">{t.purpose}</p>
              <div className="mt-3 flex flex-wrap gap-1.5"><RiskPill risk={t.risk} />{t.custom && <Pill tone="violet">Custom</Pill>}<Pill>Used by {t.usedBy}</Pill></div>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          {sel && <><SheetHeader><SheetTitle>{sel.name}</SheetTitle><SheetDescription>{sel.purpose}</SheetDescription></SheetHeader>
            <div className="space-y-4 px-4 text-sm">
              <div className="flex gap-2"><RiskPill risk={sel.risk} /><Pill tone="blue">v{sel.version}</Pill></div>
              <Panel title="Contract"><div className="grid grid-cols-2 gap-3"><div><div className="text-xs text-muted-foreground">Inputs</div>{sel.inputs.map((i) => <div key={i} className="font-mono text-xs">{i}</div>)}</div><div><div className="text-xs text-muted-foreground">Outputs</div>{sel.outputs.map((i) => <div key={i} className="font-mono text-xs">{i}</div>)}</div></div></Panel>
              <Panel title="Tools">{sel.tools.length ? sel.tools.map((t) => <div key={t}>{t}</div>) : <span className="text-muted-foreground">None — pure transformation</span>}</Panel>
              <Panel title="Runtime policy"><div className="grid grid-cols-2 gap-1 text-xs"><span className="text-muted-foreground">Timeout</span><span>30s</span><span className="text-muted-foreground">Retry</span><span>2× exponential</span><span className="text-muted-foreground">Checkpoint</span><span>{sel.risk === "High" ? "Required" : "Not required"}</span><span className="text-muted-foreground">Audit</span><span>Full I/O logged</span></div></Panel>
            </div></>}
        </SheetContent>
      </Sheet>

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          <SheetHeader><SheetTitle>New custom Taskmate</SheetTitle><SheetDescription>Structured definition. Created as Draft v0.1.0.</SheetDescription></SheetHeader>
          <div className="space-y-3 px-4">
            <div><Label>Name *</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Purpose *</Label><Textarea value={draft.purpose} onChange={(e) => setDraft({ ...draft, purpose: e.target.value })} /></div>
            <div><Label>Inputs * (comma-separated)</Label><Input className="font-mono" value={draft.inputs} onChange={(e) => setDraft({ ...draft, inputs: e.target.value })} placeholder="case_id, amount" /></div>
            <div><Label>Outputs * (comma-separated)</Label><Input className="font-mono" value={draft.outputs} onChange={(e) => setDraft({ ...draft, outputs: e.target.value })} placeholder="decision:boolean" /></div>
            <div><Label>Risk</Label><Select value={draft.risk} onValueChange={(v) => setDraft({ ...draft, risk: v as Taskmate["risk"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div>
            {errs.length > 0 && <ul className="rounded-md bg-danger-soft p-3 text-xs text-destructive">{errs.map((e) => <li key={e}>• {e}</li>)}</ul>}
            <Button className="w-full" disabled={errs.length > 0} onClick={() => {
              setList([{ id: `tk-${Date.now()}`, name: draft.name, purpose: draft.purpose, inputs: draft.inputs.split(",").map((s) => s.trim()), outputs: draft.outputs.split(",").map((s) => s.trim()), risk: draft.risk, version: "0.1.0-draft", usedBy: 0, custom: true, tools: [] }, ...list]);
              setCreating(false); setDraft({ name: "", purpose: "", inputs: "", outputs: "", risk: "Low" }); toast.success("Draft Taskmate created (sample)");
            }}>Create Draft</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
