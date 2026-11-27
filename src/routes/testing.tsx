import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Panel, Pill, SampleTag, Meter } from "@/components/aria/ui";
import { TEAMMATES } from "@/lib/aria-data";
import { INITIAL_EDGES, INITIAL_NODES } from "@/components/aria/workflow-builder";
import {
  calculateReadiness,
  DETERMINISTIC_TEST_CASES,
  readStoredTestResults,
  readStoredWorkflow,
  runDeterministicSuite,
  workflowFingerprint,
  writeStoredTestResults,
  type WorkflowSnapshot,
  type TestSuiteId,
  type TestResult,
} from "@/lib/aria-validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/testing")({
  validateSearch: (search: Record<string, unknown>) => ({
    caseId: typeof search.caseId === "string" ? search.caseId : undefined,
  }),
  head: () =>
    seo(
      "Testing & Evaluation",
      "Golden cases, hard-rule coverage, adversarial tests, checkpoints and tool calls.",
    ),
  component: Testing,
});

const SUITES: { id: TestSuiteId; label: string }[] = [
  { id: "golden", label: "Golden cases" },
  { id: "rules", label: "Hard-rule coverage" },
  { id: "adversarial", label: "Guardrail cases" },
  { id: "leakage", label: "Data leakage" },
  { id: "injection", label: "Prompt injection" },
  { id: "unsafe", label: "Unsafe actions" },
  { id: "checkpoints", label: "Checkpoint coverage" },
  { id: "tools", label: "Tool calls" },
];

function Testing() {
  const { caseId } = Route.useSearch();
  const [tm, setTm] = useState("tm-claims");
  const [workflow, setWorkflow] = useState<WorkflowSnapshot>(
    () => readStoredWorkflow("tm-claims") ?? { nodes: INITIAL_NODES, edges: INITIAL_EDGES },
  );
  const [results, setResults] = useState<TestResult[]>([]);
  const initialSuite =
    DETERMINISTIC_TEST_CASES.find((item) => item.id === caseId)?.suite ?? "golden";
  const [selectedSuite, setSelectedSuite] = useState<TestSuiteId>(initialSuite);
  useEffect(() => {
    const stored = readStoredWorkflow(tm);
    setWorkflow(
      stored ??
        (tm === "tm-claims"
          ? { nodes: INITIAL_NODES, edges: INITIAL_EDGES }
          : { nodes: [], edges: [] }),
    );
    setResults(readStoredTestResults(tm));
  }, [tm]);
  const fingerprint = workflowFingerprint(workflow);
  const readiness = calculateReadiness(results, undefined, fingerprint);
  const runAll = () => {
    const next = runDeterministicSuite(workflow);
    setResults(next);
    writeStoredTestResults(tm, next);
    const summary = calculateReadiness(next, undefined, fingerprint);
    toast("Deterministic simulator run complete", {
      description: `${summary.passed}/${summary.total} passed · ${summary.score}% readiness`,
    });
  };
  useEffect(() => {
    if (!caseId || !results.length) return;
    document.getElementById(`case-${caseId}`)?.scrollIntoView({ block: "center" });
  }, [caseId, results]);
  useEffect(() => setSelectedSuite(initialSuite), [initialSuite]);

  return (
    <div>
      <PageHeader
        eyebrow="Ship"
        title="Testing & Evaluation"
        desc="Run deterministic checks against the saved workflow. Unsupported controls are marked Not run; no external tools are called."
        actions={
          <>
            <SampleTag>Sample runs</SampleTag>
            <Select value={tm} onValueChange={setTm}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAMMATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runAll}>
              <Play className="h-4 w-4" />
              Run all suites
            </Button>
          </>
        }
      />
      <div className="space-y-6 p-8">
        <Panel
          title="Readiness score"
          action={
            <Pill tone={readiness.meetsThreshold ? "teal" : "warn"}>
              {readiness.score === null
                ? "Not run"
                : readiness.meetsThreshold
                  ? "Meets threshold"
                  : "Below threshold"}
            </Pill>
          }
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-4xl font-semibold tabular-nums">
              {readiness.score === null ? "—" : `${readiness.score}%`}
            </div>
            <div className="min-w-64 flex-1 space-y-1">
              <Meter value={readiness.score ?? 0} threshold={readiness.threshold} />
              <div className="text-xs text-muted-foreground">
                Configured threshold: {readiness.threshold}%.{" "}
                {readiness.score === null
                  ? "Run the suites to calculate readiness."
                  : readiness.meetsThreshold
                    ? "Readiness meets the threshold."
                    : "Below threshold — submission remains blocked."}
              </div>
            </div>
            {readiness.score !== null && (
              <div className="text-sm">
                {readiness.passed}/{readiness.total} cases passed
              </div>
            )}
          </div>
          {readiness.score !== null && (
            <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
              <Coverage
                label="Hard-rule coverage"
                covered={readiness.hardRuleCoverage.covered}
                total={readiness.hardRuleCoverage.total}
              />
              <Coverage
                label="Checkpoint coverage"
                covered={readiness.checkpointCoverage.covered}
                total={readiness.checkpointCoverage.total}
              />
            </div>
          )}
        </Panel>
        <Tabs
          value={selectedSuite}
          onValueChange={(value) => setSelectedSuite(value as TestSuiteId)}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
            {SUITES.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="text-xs">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {SUITES.map((suite) => {
            const suiteResults = results.filter((r) => r.suite === suite.id);
            const definitions = DETERMINISTIC_TEST_CASES.filter((c) => c.suite === suite.id);
            return (
              <TabsContent key={suite.id} value={suite.id}>
                <Panel
                  title={suite.label}
                  action={
                    <span className="text-xs text-muted-foreground">
                      {suiteResults.length
                        ? `${suiteResults.filter((r) => r.status === "passed").length}/${suiteResults.length} passed`
                        : `${definitions.length} cases · not run`}
                    </span>
                  }
                >
                  {suiteResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Run all suites to evaluate this workflow and produce traces.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {suiteResults.map((result) => (
                        <li id={`case-${result.id}`} key={result.id} className="scroll-mt-24 py-3">
                          <div className="flex items-start gap-2 text-sm">
                            {result.status === "passed" ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                            ) : result.status === "failed" ? (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            ) : (
                              <span className="mt-0.5 h-4 w-4 shrink-0 text-warning">○</span>
                            )}
                            <span className="flex-1">
                              {result.id} · {result.title}
                            </span>
                            <Pill
                              tone={
                                result.status === "passed"
                                  ? "teal"
                                  : result.status === "failed"
                                    ? "danger"
                                    : "warn"
                              }
                            >
                              {result.status === "not-run"
                                ? "Not run"
                                : result.status === "passed"
                                  ? "Passed"
                                  : "Failed"}
                            </Pill>
                          </div>
                          {result.failureReason && (
                            <div className="ml-6 mt-1 text-xs font-medium text-destructive">
                              {result.failureReason}
                            </div>
                          )}
                          <ol className="ml-6 mt-2 list-decimal space-y-0.5 pl-4 text-xs text-muted-foreground">
                            {result.trace.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

function Coverage({ label, covered, total }: { label: string; covered: number; total: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
      <span>{label}</span>
      <span className="font-mono text-xs">
        {covered}/{total || "—"}
      </span>
    </div>
  );
}
