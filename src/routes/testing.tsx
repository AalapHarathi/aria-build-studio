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
import {
  calculateReadiness,
  DETERMINISTIC_TEST_CASES,
  readStoredTestResults,
  runDeterministicSuite,
  writeStoredTestResults,
  type TestSuiteId,
  type TestResult,
} from "@/lib/aria-validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/testing")({
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
  const [tm, setTm] = useState("tm-claims");
  const [results, setResults] = useState<TestResult[]>([]);
  useEffect(() => setResults(readStoredTestResults(tm)), [tm]);
  const readiness = calculateReadiness(results);
  const runAll = () => {
    const next = runDeterministicSuite();
    setResults(next);
    writeStoredTestResults(tm, next);
    const summary = calculateReadiness(next);
    toast("Deterministic simulator run complete", {
      description: `${summary.passed}/${summary.total} passed · ${summary.score}% readiness`,
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Ship"
        title="Testing & Evaluation"
        desc="Run deterministic suites against synthetic cases. Results are sample simulations; no external tools are called."
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
        <Tabs defaultValue="golden">
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
                        ? `${suiteResults.filter((r) => r.passed).length}/${suiteResults.length} passed`
                        : `${definitions.length} cases · not run`}
                    </span>
                  }
                >
                  {suiteResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Run all suites to produce results and traces for these sample cases.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {suiteResults.map((result) => (
                        <li key={result.id} className="py-3">
                          <div className="flex items-start gap-2 text-sm">
                            {result.passed ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                            ) : (
                              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            )}
                            <span className="flex-1">
                              {result.id} · {result.title}
                            </span>
                            <Pill tone={result.passed ? "teal" : "danger"}>
                              {result.passed ? "Passed" : "Failed"}
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
