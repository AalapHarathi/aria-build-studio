import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FlaskConical,
  Layers3,
  Plus,
  Rocket,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Pill, SampleTag, StageBadge } from "@/components/aria/ui";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
  validate,
  type WNode,
} from "@/components/aria/workflow-builder";
import {
  ENGINES,
  LIFECYCLE,
  RECENT_CHANGES,
  REVIEWS,
  ROLES,
  SAMPLE_WORKSPACES,
  TASKMATES,
  TEAMMATES,
  type Stage,
} from "@/lib/aria-data";
import {
  readStoredTestResults,
  readStoredWorkflow,
  workflowFingerprint,
  calculateReadiness,
  type TestResult,
} from "@/lib/aria-validation";
import { useApp } from "@/lib/app-state";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => seo("Studio Overview", "Configure, test, review and release AI Teammates."),
  component: Overview,
});

const stageTone: Record<Stage, string> = {
  Draft: "border-slate-400/30 bg-slate-400/10",
  "In review": "border-violet/30 bg-violet-soft",
  Approved: "border-teal/30 bg-teal-soft",
  Staged: "border-primary/30 bg-blue-soft",
  Canary: "border-warning/30 bg-warning-soft",
  Production: "border-teal/30 bg-teal-soft",
};

function Overview() {
  const { role, workspace } = useApp();
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [results, setResults] = useState<TestResult[]>([]);
  const [workflow, setWorkflow] = useState(() => ({ nodes: INITIAL_NODES, edges: INITIAL_EDGES }));
  const [configuredWorkflowCount, setConfiguredWorkflowCount] = useState<number | null>(null);
  useEffect(() => {
    setResults(readStoredTestResults("tm-claims"));
    const saved = readStoredWorkflow("tm-claims");
    if (saved) setWorkflow(saved);
  }, []);
  const scope = SAMPLE_WORKSPACES.find((w) => w.id === workspace);
  const teammates =
    workspace === "all" ? TEAMMATES : TEAMMATES.filter((t) => scope?.teammateIds?.includes(t.id));
  useEffect(() => {
    setConfiguredWorkflowCount(
      TEAMMATES.filter(
        (teammate) =>
          (workspace === "all" ||
            SAMPLE_WORKSPACES.find((item) => item.id === workspace)?.teammateIds?.includes(
              teammate.id,
            )) &&
          readStoredWorkflow(teammate.id),
      ).length,
    );
  }, [workspace]);
  const teammateNames = new Set(teammates.map((t) => t.name));
  const workspaceReviews = REVIEWS.filter(
    (r) => r.status === "Awaiting review" && (workspace === "all" || teammateNames.has(r.teammate)),
  );
  const reviews = workspaceReviews.filter((r) => r.assignee === ROLES[role].person);
  const claimsInScope = workspace === "all" || scope?.teammateIds?.includes("tm-claims");
  const visibleResults = claimsInScope ? results : [];
  const readiness = calculateReadiness(visibleResults, undefined, workflowFingerprint(workflow));
  const failures = readiness.stale ? [] : visibleResults.filter((r) => r.status === "failed");
  const validationIssues = claimsInScope
    ? validate(workflow.nodes, workflow.edges).filter((i) => i.blocking)
    : [];
  const lifecycle = LIFECYCLE.map((stage) => ({
    stage,
    count: teammates.filter((t) => t.stage === stage).length,
  }));
  const inProgressReleases = teammates.filter(
    (t) => t.stage === "Staged" || t.stage === "Canary",
  ).length;
  const taskmateCount = TASKMATES.filter((t) => t.usedBy > 0).length;
  const recentActivity = RECENT_CHANGES.filter(
    (event) => workspace === "all" || teammates.some((t) => t.name.startsWith(event.target)),
  );
  const workItems = [
    ...(role === "reviewer"
      ? reviews.map((r) => ({
          id: r.id,
          title: r.title,
          detail: `Awaiting review · ${r.author} · ${r.submitted}`,
          action: "Review now",
          to: "/reviews",
          reviewId: r.id,
          caseId: "",
          icon: ClipboardCheck,
          tone: "text-violet",
        }))
      : []),
    ...(readiness.stale
      ? [
          {
            id: "test-results-stale",
            title: "Claims Resolution tests need rerunning",
            detail: "The workflow changed since the last test run.",
            action: "Rerun tests",
            to: "/testing",
            reviewId: "",
            caseId: "",
            icon: FlaskConical,
            tone: "text-warning",
          },
        ]
      : []),
    ...failures.map((f) => ({
      id: f.id,
      title: f.title,
      detail: `Failed check · expected ${f.expected}, observed ${f.observed}`,
      action: "Inspect trace",
      to: "/testing",
      reviewId: "",
      caseId: f.id,
      icon: FlaskConical,
      tone: "text-destructive",
    })),
    ...(role === "operator"
      ? teammates
          .filter((t) => t.stage === "Approved")
          .map((t) => ({
            id: t.id,
            title: `${t.name} is approved`,
            detail: `Release can be staged · v${t.version}`,
            action: "Open release",
            to: "/releases",
            reviewId: "",
            caseId: "",
            icon: Rocket,
            tone: "text-primary",
          }))
      : []),
    ...(role === "builder"
      ? teammates
          .filter((t) => t.owner === ROLES.builder.person && t.stage === "Draft")
          .map((t) => ({
            id: t.id,
            title: `${t.name} is a draft`,
            detail: `Continue configuration · v${t.version}`,
            action: "Continue draft",
            to: "/teammate-studio",
            reviewId: "",
            caseId: "",
            icon: Workflow,
            tone: "text-primary",
          }))
      : []),
  ];
  const stageLabel = (stage: Stage) => (stage === "In review" ? "In Review" : stage);

  return (
    <div className="min-h-full">
      <PageHeader
        eyebrow="Build Studio / Overview"
        title="Studio Overview"
        desc="Configure, test, review and release AI Teammates."
        actions={
          <>
            <SampleTag>Seeded sample records</SampleTag>
            {role === "builder" ? (
              <Button asChild>
                <Link to="/teammate-studio">
                  <Plus className="h-4 w-4" />
                  New Teammate
                </Link>
              </Button>
            ) : role === "reviewer" ? (
              <Button asChild>
                <Link to="/reviews">Open assigned reviews</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/releases">Manage releases</Link>
              </Button>
            )}
          </>
        }
      />
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <Metric
            icon={Layers3}
            label="Total Teammates"
            value={teammates.length}
            note="Seeded records in selected workspace"
          />
          <Metric
            icon={Boxes}
            label="Reusable Taskmates"
            value={taskmateCount}
            note="Used by at least one seeded Teammate"
          />
          <Metric
            icon={Workflow}
            label="Configured Workflows"
            value={configuredWorkflowCount === null ? "…" : configuredWorkflowCount}
            note="Saved in this browser · sample data"
          />
          <Metric
            icon={Rocket}
            label="Releases in progress"
            value={inProgressReleases}
            note="Staged or Canary lifecycle records"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
          <Panel title="Teammate lifecycle" action={<SampleTag>Sample records</SampleTag>}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
              {lifecycle.map(({ stage, count }) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stageFilter === stage ? "all" : stage)}
                  aria-pressed={stageFilter === stage}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors hover:border-primary",
                    stageTone[stage],
                    stageFilter === stage && "ring-2 ring-primary",
                  )}
                >
                  <span className="block text-xs font-medium text-muted-foreground">
                    {stageLabel(stage)}
                  </span>
                  <span className="mt-1 block text-2xl font-semibold tabular-nums">{count}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {count === 1 ? "Teammate" : "Teammates"}
                  </span>
                </button>
              ))}
            </div>
            {stageFilter !== "all" && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {teammates
                  .filter((t) => t.stage === stageFilter)
                  .map((t) => (
                    <Link
                      key={t.id}
                      to="/teammate-studio"
                      className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted"
                    >
                      <span>{t.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    </Link>
                  ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
              <span>Lifecycle counts are derived from the seeded Teammate records.</span>
              {stageFilter === "all" ? (
                <Link to="/teammate-studio" className="text-primary hover:underline">
                  Browse Teammates
                </Link>
              ) : (
                <button
                  onClick={() => setStageFilter("all")}
                  className="text-primary hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </Panel>

          <Panel
            title="Pending work"
            action={
              <Pill tone={workItems.length ? "warn" : "muted"}>{workItems.length} items</Pill>
            }
          >
            {workItems.length ? (
              <ul className="divide-y">
                {workItems.map((item) => (
                  <li key={item.id}>
                    <WorkItemLink item={item}>
                      <item.icon className={cn("mt-0.5 h-4 w-4 shrink-0", item.tone)} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {item.title}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.id}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                        <span className="mt-1 block text-xs text-primary">
                          {item.action}{" "}
                          <ArrowRight className="inline h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </span>
                    </WorkItemLink>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>There are no pending items in this sample workspace.</Empty>
            )}
            <div className="mt-2 border-t pt-3 text-xs text-muted-foreground">
              Governance action feed: <span className="font-medium">Unavailable</span> · no
              connected governance event source.
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
          <Panel
            title="Engine health"
            action={
              <Pill tone="warn">
                <CircleAlert className="h-3 w-3" />
                Health source unavailable
              </Pill>
            }
          >
            <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
              {ENGINES.map((engine, i) => (
                <Link
                  key={engine.slug}
                  to="/core/$engine"
                  params={{ engine: engine.slug }}
                  className="group rounded-lg border p-3 transition-colors hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          0{i + 1}
                        </span>
                        {engine.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{engine.short}</div>
                    </div>
                    <Pill tone="warn">Unknown</Pill>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2 text-[11px]">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="text-right">Not connected</span>
                    <span className="text-muted-foreground">Last health check</span>
                    <span className="text-right">Unavailable</span>
                    <span className="text-muted-foreground">Active alerts</span>
                    <span className="text-right">Unknown</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono">{engine.slug}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel
            title="Operational issues"
            action={
              <Pill
                tone={
                  failures.length + validationIssues.length + Number(readiness.stale)
                    ? "danger"
                    : "muted"
                }
              >
                {failures.length + validationIssues.length + Number(readiness.stale)} detected
              </Pill>
            }
          >
            {readiness.stale && (
              <Issue
                severity="warning"
                title="Test results are stale"
                detail="The saved workflow changed after the last test run. Rerun evaluation."
                resource="Claims Resolution · tm-claims"
                to="/testing"
                action="Rerun tests"
              />
            )}
            {failures.map((f) => (
              <Issue
                key={f.id}
                severity="critical"
                title={`${f.id} · ${f.title}`}
                detail={f.failureReason ?? `Expected ${f.expected}; observed ${f.observed}.`}
                resource="Claims Resolution · tm-claims"
                to="/testing"
                caseId={f.id}
                action="Inspect test trace"
              />
            ))}
            {validationIssues.map((issue, i) => (
              <Issue
                key={`${issue.id}-${i}`}
                severity="critical"
                title="Workflow checkpoint blocker"
                detail={issue.msg}
                resource={issue.id ?? "Claims Resolution · tm-claims"}
                to="/teammate-studio"
                action="Open workflow"
              />
            ))}
            {!failures.length && !validationIssues.length && !readiness.stale && (
              <Empty>
                <CheckCircle2 className="mr-2 inline h-4 w-4 text-teal" />
                No workflow or test blockers are recorded in the current sample data.
              </Empty>
            )}
            <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4" />
              Integration readiness and governance blockers are unavailable until Control Centre
              data is connected.
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Recent activity" action={<SampleTag>Illustrative activity</SampleTag>}>
            {recentActivity.length ? (
              <ol className="divide-y">
                {recentActivity.map((event, i) => (
                  <li key={`${event.who}-${event.when}-${i}`}>
                    <Link to="/teammate-studio" className="flex gap-3 py-3 hover:bg-muted/40">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted">
                        <Activity className="h-3.5 w-3.5 text-primary" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-sm">
                          <strong>{event.who}</strong>{" "}
                          <span className="text-muted-foreground">{event.what}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-primary">{event.target}</span>
                      </span>
                      <time className="shrink-0 text-[11px] text-muted-foreground">
                        {event.when}
                      </time>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>No sample activity is associated with this workspace.</Empty>
            )}
          </Panel>
          <Panel title="Workspace snapshot" action={<SampleTag>Seeded sample records</SampleTag>}>
            <div className="mb-3 text-sm font-medium">{scope?.name ?? "All sample workspaces"}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Snapshot label="Teammates in scope" value={teammates.length} />
              <Snapshot label="Awaiting review" value={workspaceReviews.length} />
              <Snapshot label="Reusable Taskmates" value={taskmateCount} />
              <Snapshot label="Failed current checks" value={failures.length} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              <Button asChild size="sm" variant="outline">
                <Link to="/reviews">Open reviews</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/testing">Open testing</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/releases">Open releases</Link>
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Boxes;
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}
function Snapshot({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
type PendingItem = {
  id: string;
  title: string;
  detail: string;
  action: string;
  to: string;
  reviewId: string;
  caseId: string;
  icon: typeof Boxes;
  tone: string;
};
function WorkItemLink({ item, children }: { item: PendingItem; children: React.ReactNode }) {
  const className = "group flex gap-3 py-3";
  if (item.reviewId) {
    return (
      <Link to="/reviews" search={{ reviewId: item.reviewId }} className={className}>
        {children}
      </Link>
    );
  }
  if (item.caseId) {
    return (
      <Link to="/testing" search={{ caseId: item.caseId }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to={item.to as "/"} className={className}>
      {children}
    </Link>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>;
}
function Issue({
  severity,
  title,
  detail,
  resource,
  to,
  caseId,
  action,
}: {
  severity: "critical" | "warning";
  title: string;
  detail: string;
  resource: string;
  to: string;
  caseId?: string;
  action: string;
}) {
  return (
    <div className="border-b py-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            severity === "critical" ? "text-destructive" : "text-warning",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {title}
            <Pill tone={severity === "critical" ? "danger" : "warn"}>
              {severity === "critical" ? "Critical" : "Needs attention"}
            </Pill>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">{resource}</div>
          {caseId ? (
            <Link
              to="/testing"
              search={{ caseId }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {action}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <Link
              to={to as "/"}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {action}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
