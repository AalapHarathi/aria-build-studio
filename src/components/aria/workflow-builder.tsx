import { useRef, useState, type DragEvent, type PointerEvent as RPE } from "react";
import {
  Play, Flag, Boxes, GitBranch, ShieldCheck, Split, Merge, Library, Database, Plug, UserCheck, AlertOctagon, Timer, RefreshCw, Trash2, Plus, AlertTriangle, Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASKMATES } from "@/lib/aria-data";
import { cn } from "@/lib/utils";
import { Pill, RiskPill } from "./ui";

export type Kind = "trigger" | "taskmate" | "condition" | "rule" | "parallel" | "merge" | "knowledge" | "memory" | "tool" | "checkpoint" | "escalation" | "wait" | "retry" | "outcome";
export type Rule = { field: string; op: string; value: string; then: string };
export type WNode = {
  id: string; kind: Kind; label: string; x: number; y: number;
  inputs: string; outputs: string; preconditions: string; onSuccess: string; onFailure: string;
  timeout: number; retries: number; risk: "Low" | "Medium" | "High"; permissions: string; audit: boolean; decisionRecord: boolean; external: boolean; rules: Rule[];
};

export const KINDS: Record<Kind, { label: string; icon: typeof Play; group: string; tone: string }> = {
  trigger: { label: "Trigger", icon: Play, group: "Flow", tone: "text-teal" },
  outcome: { label: "Outcome", icon: Flag, group: "Flow", tone: "text-teal" },
  parallel: { label: "Parallel", icon: Split, group: "Flow", tone: "text-muted-foreground" },
  merge: { label: "Merge", icon: Merge, group: "Flow", tone: "text-muted-foreground" },
  wait: { label: "Wait", icon: Timer, group: "Flow", tone: "text-muted-foreground" },
  retry: { label: "Retry", icon: RefreshCw, group: "Flow", tone: "text-muted-foreground" },
  taskmate: { label: "Taskmate", icon: Boxes, group: "Work", tone: "text-primary" },
  knowledge: { label: "Knowledge lookup", icon: Library, group: "Work", tone: "text-violet" },
  memory: { label: "Memory", icon: Database, group: "Work", tone: "text-violet" },
  tool: { label: "MCP / API tool", icon: Plug, group: "Work", tone: "text-primary" },
  condition: { label: "Condition", icon: GitBranch, group: "Logic", tone: "text-warning" },
  rule: { label: "Rule check", icon: ShieldCheck, group: "Logic", tone: "text-warning" },
  checkpoint: { label: "Human checkpoint", icon: UserCheck, group: "Control", tone: "text-destructive" },
  escalation: { label: "Escalation", icon: AlertOctagon, group: "Control", tone: "text-destructive" },
};

let seq = 100;
export function makeNode(kind: Kind, x: number, y: number, over: Partial<WNode> = {}): WNode {
  return { id: `n${seq++}`, kind, label: KINDS[kind].label, x, y, inputs: "", outputs: "", preconditions: "", onSuccess: "continue", onFailure: "escalate", timeout: 30, retries: 1, risk: "Low", permissions: "", audit: true, decisionRecord: false, external: kind === "tool", rules: kind === "condition" || kind === "rule" ? [{ field: "amount", op: ">", value: "5000", then: "route:checkpoint" }] : [], ...over };
}

export const INITIAL_NODES: WNode[] = [
  makeNode("trigger", 40, 140, { id: "n1", label: "Claim submitted", outputs: "claim_id" }),
  makeNode("taskmate", 230, 140, { id: "n2", label: "Document Intake", inputs: "claim_id", outputs: "fields{}" }),
  makeNode("knowledge", 230, 280, { id: "n3", label: "Policy wording lookup", inputs: "policy_id", outputs: "clauses[]" }),
  makeNode("rule", 420, 140, { id: "n4", label: "Coverage & threshold", inputs: "fields{}, clauses[]", outputs: "route", risk: "Medium" }),
  makeNode("taskmate", 610, 60, { id: "n5", label: "Payout Preparation", inputs: "amount, payee", outputs: "instruction_id", risk: "High", permissions: "payments:prepare" }),
  makeNode("tool", 800, 60, { id: "n6", label: "Payments API (sample)", inputs: "instruction_id", outputs: "payment_ref", risk: "High", permissions: "payments:write", decisionRecord: true }),
  makeNode("escalation", 610, 240, { id: "n7", label: "Escalate to adjuster", inputs: "case{}", risk: "Low" }),
  makeNode("outcome", 990, 140, { id: "n8", label: "Claim resolved" }),
];
export const INITIAL_EDGES: [string, string][] = [["n1", "n2"], ["n2", "n4"], ["n3", "n4"], ["n4", "n5"], ["n4", "n7"], ["n5", "n6"], ["n6", "n8"], ["n7", "n8"]];

export function validate(nodes: WNode[], edges: [string, string][]) {
  const issues: { id?: string; msg: string; blocking: boolean }[] = [];
  const upstream = (id: string, seen = new Set<string>()): string[] => edges.filter(([, b]) => b === id).flatMap(([a]) => (seen.has(a) ? [] : (seen.add(a), [a, ...upstream(a, seen)])));
  for (const n of nodes) {
    if (n.risk === "High" && n.kind !== "checkpoint" && !upstream(n.id).some((u) => nodes.find((x) => x.id === u)?.kind === "checkpoint"))
      issues.push({ id: n.id, msg: `"${n.label}" is high-risk with no upstream human checkpoint — blocks testing`, blocking: true });
    if (n.external && !n.decisionRecord) issues.push({ id: n.id, msg: `"${n.label}" is an external action without a Cognitive Core decision record`, blocking: true });
    if (n.kind !== "trigger" && !edges.some(([, b]) => b === n.id)) issues.push({ id: n.id, msg: `"${n.label}" has no incoming connection`, blocking: false });
  }
  if (!nodes.some((n) => n.kind === "trigger")) issues.push({ msg: "Workflow needs a trigger", blocking: true });
  if (!nodes.some((n) => n.kind === "outcome")) issues.push({ msg: "Workflow needs an outcome", blocking: true });
  return issues;
}

const W = 160, H = 58;

export function WorkflowBuilder({ nodes, setNodes, edges, setEdges }: { nodes: WNode[]; setNodes: (f: (n: WNode[]) => WNode[]) => void; edges: [string, string][]; setEdges: (f: (e: [string, string][]) => [string, string][]) => void }) {
  const [sel, setSel] = useState<string | null>("n5");
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const issues = validate(nodes, edges);
  const node = nodes.find((n) => n.id === sel);
  const update = (patch: Partial<WNode>) => node && setNodes((ns) => ns.map((n) => (n.id === node.id ? { ...n, ...patch } : n)));

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("aria/kind");
    if (!raw) return;
    const [kind, tm] = raw.split("|") as [Kind, string?];
    const r = canvasRef.current!.getBoundingClientRect();
    const t = TASKMATES.find((x) => x.id === tm);
    const n = makeNode(kind, e.clientX - r.left + canvasRef.current!.scrollLeft - W / 2, e.clientY - r.top + canvasRef.current!.scrollTop - H / 2,
      t ? { label: t.name, inputs: t.inputs.join(", "), outputs: t.outputs.join(", "), risk: t.risk } : {});
    setNodes((ns) => [...ns, n]);
    setSel(n.id);
  };
  const onPointerDown = (e: RPE, n: WNode) => {
    setSel(n.id);
    drag.current = { id: n.id, dx: e.clientX - n.x, dy: e.clientY - n.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: RPE) => {
    const d = drag.current;
    if (!d) return;
    setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: Math.max(0, e.clientX - d.dx), y: Math.max(0, e.clientY - d.dy) } : n)));
  };

  const groups = ["Flow", "Work", "Logic", "Control"];
  return (
    <div className="grid h-[680px] grid-cols-[220px_1fr_340px] overflow-hidden rounded-lg border bg-card">
      {/* Library */}
      <div className="overflow-y-auto border-r p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Component library</div>
        {groups.map((g) => (
          <div key={g} className="mb-3">
            <div className="mb-1 text-[11px] font-medium text-muted-foreground">{g}</div>
            {(Object.entries(KINDS) as [Kind, (typeof KINDS)[Kind]][]).filter(([, k]) => k.group === g).map(([kind, k]) => (
              <div key={kind} draggable onDragStart={(e) => e.dataTransfer.setData("aria/kind", kind)} className="mb-1 flex cursor-grab items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs hover:border-primary">
                <k.icon className={cn("h-3.5 w-3.5", k.tone)} />{k.label}
              </div>
            ))}
          </div>
        ))}
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">Reusable Taskmates</div>
        {TASKMATES.map((t) => (
          <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("aria/kind", `taskmate|${t.id}`)} className="mb-1 flex cursor-grab items-center justify-between gap-1 rounded-md border bg-background px-2 py-1.5 text-xs hover:border-primary">
            <span className="truncate">{t.name}</span><span className="font-mono text-[10px] text-muted-foreground">{t.version}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-3 py-2 text-xs">
          <span className="text-muted-foreground">Drag components onto the canvas · drag nodes to move · click to inspect</span>
          <span className={cn("font-medium", issues.some((i) => i.blocking) ? "text-destructive" : "text-teal")}>{issues.filter((i) => i.blocking).length} blocking · {issues.filter((i) => !i.blocking).length} warnings</span>
        </div>
        <div ref={canvasRef} onDragOver={(e) => e.preventDefault()} onDrop={onDrop} onPointerMove={onPointerMove} onPointerUp={() => (drag.current = null)} onClick={(e) => e.target === e.currentTarget && setSel(null)} className="canvas-grid relative flex-1 overflow-auto">
          <svg className="pointer-events-none absolute left-0 top-0" width={1400} height={700}>
            <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" /></marker></defs>
            {edges.map(([a, b]) => {
              const A = nodes.find((n) => n.id === a), B = nodes.find((n) => n.id === b);
              if (!A || !B) return null;
              const x1 = A.x + W, y1 = A.y + H / 2, x2 = B.x, y2 = B.y + H / 2, mx = (x1 + x2) / 2;
              return <path key={a + b} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} className="fill-none stroke-muted-foreground" strokeWidth={1.5} markerEnd="url(#arr)" />;
            })}
          </svg>
          {nodes.map((n) => {
            const K = KINDS[n.kind];
            const bad = issues.some((i) => i.id === n.id && i.blocking);
            return (
              <div key={n.id} onPointerDown={(e) => onPointerDown(e, n)} style={{ left: n.x, top: n.y, width: W, height: H }}
                className={cn("absolute cursor-move touch-none select-none rounded-md border bg-card px-2.5 py-2 shadow-sm", sel === n.id && "ring-2 ring-primary", bad && "border-destructive")}>
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"><K.icon className={cn("h-3 w-3", K.tone)} />{K.label}{n.risk === "High" && <span className="ml-auto text-destructive">HIGH</span>}</div>
                <div className="mt-0.5 truncate text-xs font-semibold">{n.label}</div>
                {bad && <AlertTriangle className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-card text-destructive" />}
              </div>
            );
          })}
        </div>
        <div className="max-h-28 overflow-y-auto border-t bg-muted/40 px-3 py-2 text-xs">
          {issues.length === 0 ? <span className="text-teal">Deterministic validation passed.</span> : issues.map((i, k) => (
            <button key={k} onClick={() => i.id && setSel(i.id)} className={cn("block text-left hover:underline", i.blocking ? "text-destructive" : "text-warning")}>{i.blocking ? "⛔" : "⚠"} {i.msg}</button>
          ))}
        </div>
      </div>

      {/* Inspector */}
      <div className="overflow-y-auto border-l">
        {!node ? <div className="p-4 text-sm text-muted-foreground">Select a node to configure it.</div> : (
          <div>
            <div className="flex items-center justify-between border-b p-3">
              <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{KINDS[node.kind].label}</div><div className="text-sm font-semibold">{node.label}</div></div>
              <Button size="icon" variant="ghost" aria-label="Delete node" onClick={() => { setNodes((ns) => ns.filter((n) => n.id !== node.id)); setEdges((es) => es.filter(([a, b]) => a !== node.id && b !== node.id)); setSel(null); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Tabs defaultValue="config" className="p-3">
              <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="config">Config</TabsTrigger><TabsTrigger value="rules">Rules</TabsTrigger><TabsTrigger value="runtime">Runtime</TabsTrigger><TabsTrigger value="risk">Risk</TabsTrigger></TabsList>
              <TabsContent value="config" className="space-y-3">
                <F label="Label"><Input value={node.label} onChange={(e) => update({ label: e.target.value })} /></F>
                <F label="Inputs"><Input className="font-mono text-xs" value={node.inputs} onChange={(e) => update({ inputs: e.target.value })} /></F>
                <F label="Outputs"><Input className="font-mono text-xs" value={node.outputs} onChange={(e) => update({ outputs: e.target.value })} /></F>
                <F label="Preconditions"><Input className="font-mono text-xs" placeholder="fields.complete == true" value={node.preconditions} onChange={(e) => update({ preconditions: e.target.value })} /></F>
                <F label="Connect to next">
                  <Select value="" onValueChange={(v) => setEdges((es) => (es.some(([a, b]) => a === node.id && b === v) ? es : [...es, [node.id, v]]))}>
                    <SelectTrigger><SelectValue placeholder="Add connection…" /></SelectTrigger>
                    <SelectContent>{nodes.filter((n) => n.id !== node.id).map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent>
                  </Select>
                </F>
                <div className="flex flex-wrap gap-1">{edges.filter(([a]) => a === node.id).map(([, b]) => <button key={b} onClick={() => setEdges((es) => es.filter(([x, y]) => !(x === node.id && y === b)))} className="rounded-full border px-2 py-0.5 text-[11px] hover:border-destructive">→ {nodes.find((n) => n.id === b)?.label} ×</button>)}</div>
              </TabsContent>
              <TabsContent value="rules"><RuleEditor node={node} update={update} /></TabsContent>
              <TabsContent value="runtime" className="space-y-3">
                <F label="On success"><Input value={node.onSuccess} onChange={(e) => update({ onSuccess: e.target.value })} /></F>
                <F label="On failure"><Select value={node.onFailure} onValueChange={(v) => update({ onFailure: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["escalate", "retry", "abstain", "halt"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></F>
                <div className="grid grid-cols-2 gap-2"><F label="Timeout (s)"><Input type="number" value={node.timeout} onChange={(e) => update({ timeout: +e.target.value })} /></F><F label="Retries"><Input type="number" value={node.retries} onChange={(e) => update({ retries: +e.target.value })} /></F></div>
              </TabsContent>
              <TabsContent value="risk" className="space-y-3">
                <F label="Risk level"><Select value={node.risk} onValueChange={(v) => update({ risk: v as WNode["risk"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Low", "Medium", "High"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></F>
                <RiskPill risk={node.risk} />
                <F label="Permissions (scopes)"><Input className="font-mono text-xs" value={node.permissions} onChange={(e) => update({ permissions: e.target.value })} /></F>
                <Toggle label="External action" desc="Writes to a system outside Aria" v={node.external} on={(v) => update({ external: v })} />
                <Toggle label="Cognitive Core decision record" desc="Required for external actions" v={node.decisionRecord} on={(v) => update({ decisionRecord: v })} />
                <Toggle label="Audit full inputs/outputs" desc="Governance Sentinel audit trail" v={node.audit} on={(v) => update({ audit: v })} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
function Toggle({ label, desc, v, on }: { label: string; desc: string; v: boolean; on: (v: boolean) => void }) {
  return <div className="flex items-center justify-between gap-2 rounded-md border p-2"><div><div className="text-xs font-medium">{label}</div><div className="text-[11px] text-muted-foreground">{desc}</div></div><Switch checked={v} onCheckedChange={on} /></div>;
}

const toDsl = (rules: Rule[]) => rules.map((r) => `IF ${r.field} ${r.op} ${r.value} THEN ${r.then}`).join("\n");
function parseDsl(src: string): { rules: Rule[]; errors: string[] } {
  const rules: Rule[] = [], errors: string[] = [];
  src.split("\n").map((l) => l.trim()).filter(Boolean).forEach((l, i) => {
    const m = l.match(/^IF\s+(\w[\w.]*)\s*(==|!=|>=|<=|>|<|IN)\s*(.+?)\s+THEN\s+(\S+)$/i);
    if (!m) errors.push(`Line ${i + 1}: expected "IF <field> <op> <value> THEN <action>"`);
    else rules.push({ field: m[1]!, op: m[2]!.toUpperCase() === "IN" ? "IN" : m[2]!, value: m[3]!, then: m[4]! });
  });
  return { rules, errors };
}

function RuleEditor({ node, update }: { node: WNode; update: (p: Partial<WNode>) => void }) {
  const [mode, setMode] = useState<"visual" | "advanced">("visual");
  const [src, setSrc] = useState(toDsl(node.rules));
  const parsed = parseDsl(src);
  const set = (i: number, p: Partial<Rule>) => update({ rules: node.rules.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
        {(["visual", "advanced"] as const).map((m) => <button key={m} onClick={() => { setMode(m); if (m === "advanced") setSrc(toDsl(node.rules)); }} className={cn("flex-1 rounded px-2 py-1 capitalize", mode === m && "bg-card shadow-sm")}>{m === "visual" ? "Visual IF/THEN" : "Advanced editor"}</button>)}
      </div>
      {mode === "visual" ? (
        <>
          {node.rules.length === 0 && <p className="text-xs text-muted-foreground">No rules on this node.</p>}
          {node.rules.map((r, i) => (
            <div key={i} className="space-y-1.5 rounded-md border p-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-warning">IF</div>
              <div className="grid grid-cols-[1fr_64px_1fr] gap-1">
                <Input className="h-8 font-mono text-xs" value={r.field} onChange={(e) => set(i, { field: e.target.value })} />
                <Select value={r.op} onValueChange={(v) => set(i, { op: v })}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["==", "!=", ">", ">=", "<", "<=", "IN"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                <Input className="h-8 font-mono text-xs" value={r.value} onChange={(e) => set(i, { value: e.target.value })} />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-teal">THEN</div>
              <div className="flex gap-1">
                <Select value={r.then} onValueChange={(v) => set(i, { then: v })}><SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger><SelectContent>{["route:checkpoint", "route:escalation", "route:continue", "block", "abstain", r.then].filter((v, k, a) => a.indexOf(v) === k).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => update({ rules: node.rules.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full" onClick={() => update({ rules: [...node.rules, { field: "field", op: "==", value: "value", then: "route:continue" }] })}><Plus className="h-3.5 w-3.5" />Add rule</Button>
        </>
      ) : (
        <>
          <Textarea className="min-h-32 font-mono text-xs" value={src} onChange={(e) => setSrc(e.target.value)} />
          {parsed.errors.length ? parsed.errors.map((e) => <div key={e} className="text-xs text-destructive">{e}</div>) : <div className="text-xs text-teal">Parsed {parsed.rules.length} rule(s) deterministically.</div>}
          <Button size="sm" className="w-full" disabled={parsed.errors.length > 0} onClick={() => { update({ rules: parsed.rules }); setMode("visual"); }}><Wand2 className="h-3.5 w-3.5" />Apply to visual rules</Button>
        </>
      )}
      <Pill tone="muted">Rules are evaluated top-to-bottom; first match wins.</Pill>
    </div>
  );
}
