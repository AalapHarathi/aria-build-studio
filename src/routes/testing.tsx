import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Pill, SampleTag, Meter } from "@/components/aria/ui";
import { READINESS_THRESHOLD, TEAMMATES } from "@/lib/aria-data";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/testing")({ head: () => seo("Testing & Evaluation", "Golden cases, hard-rule coverage, adversarial tests, checkpoints and tool calls."), component: Testing });

const SUITES: Record<string, { label: string; cases: [string, boolean][] }> = {
  golden: { label: "Golden cases", cases: [["GC-01 Standard claim £1,200", true], ["GC-02 Claim at £5,000 boundary", true], ["GC-03 Missing police report", true], ["GC-04 Duplicate submission", false], ["GC-05 Policy lapsed", true]] },
  rules: { label: "Hard-rule coverage", cases: [["HR-01 Payout > £5k requires approval", true], ["HR-02 No PII in external messages", true], ["HR-07 Escalate on fraud score ≥ 70", false]] },
  adversarial: { label: "Adversarial / guardrail", cases: [["ADV-01 Instruction override in document text", true], ["ADV-02 Out-of-scope request", true], ["ADV-03 Forged approval reference", true]] },
  checkpoints: { label: "Checkpoint coverage", cases: [["CP-01 Payout Preparation checkpoint reached", true], ["CP-02 Fraud escalation reaches reviewer", true]] },
  tools: { label: "Tool calls", cases: [["TC-01 Policy API called with decision record", true], ["TC-02 Payments API blocked without checkpoint", true], ["TC-03 Email MCP uses approved template", false]] },
};

function Testing() {
  const [tm, setTm] = useState("tm-claims");
  const [ran, setRan] = useState(false);
  const all = Object.values(SUITES).flatMap((s) => s.cases);
  const pass = all.filter((c) => c[1]).length;
  const score = ran ? Math.round((pass / all.length) * 100) : TEAMMATES.find((t) => t.id === tm)!.readiness;
  return (
    <div>
      <PageHeader eyebrow="Ship" title="Testing & Evaluation" desc="Deterministic test suites run against a Teammate version. Readiness must meet the threshold before submission for review."
        actions={<><SampleTag>Simulated runs</SampleTag>
          <Select value={tm} onValueChange={(v) => { setTm(v); setRan(false); }}><SelectTrigger className="w-64"><SelectValue /></SelectTrigger><SelectContent>{TEAMMATES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
          <Button onClick={() => { setRan(true); toast("Simulated test run complete", { description: `${pass}/${all.length} passed` }); }}><Play className="h-4 w-4" />Run all suites</Button></>} />
      <div className="space-y-6 p-8">
        <Panel title="Readiness score">
          <div className="flex items-center gap-6">
            <div className="text-4xl font-semibold tabular-nums">{score}%</div>
            <div className="flex-1 space-y-1"><Meter value={score} threshold={READINESS_THRESHOLD} /><div className="text-xs text-muted-foreground">Illustrative threshold: {READINESS_THRESHOLD}%. {score >= READINESS_THRESHOLD ? "Eligible to submit for review." : "Below threshold — submission blocked."}</div></div>
            {score >= READINESS_THRESHOLD ? <Pill tone="teal">Meets threshold</Pill> : <Pill tone="warn">Below threshold</Pill>}
          </div>
        </Panel>
        <Tabs defaultValue="golden">
          <TabsList>{Object.entries(SUITES).map(([k, s]) => <TabsTrigger key={k} value={k}>{s.label}</TabsTrigger>)}</TabsList>
          {Object.entries(SUITES).map(([k, s]) => (
            <TabsContent key={k} value={k}><Panel title={s.label} action={<span className="text-xs text-muted-foreground">{s.cases.filter((c) => c[1]).length}/{s.cases.length} passing</span>}>
              <ul className="divide-y">{s.cases.map(([n, ok]) => <li key={n} className="flex items-center gap-2 py-2 text-sm">{ok ? <CheckCircle2 className="h-4 w-4 text-teal" /> : <XCircle className="h-4 w-4 text-destructive" />}<span className="flex-1">{n}</span><span className="font-mono text-xs text-muted-foreground">{ok ? "expected = actual" : "assertion failed"}</span></li>)}</ul>
            </Panel></TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
