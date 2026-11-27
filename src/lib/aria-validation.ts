import { READINESS_THRESHOLD } from "./aria-data";
import { validate, type WNode } from "@/components/aria/workflow-builder";

export type TestSuiteId =
  "golden" | "rules" | "adversarial" | "leakage" | "injection" | "unsafe" | "checkpoints" | "tools";

export type WorkflowSnapshot = {
  nodes: WNode[];
  edges: [string, string][];
};

export type TestCheck =
  | "trigger-outcome-path"
  | "taskmate-present"
  | "high-risk-checkpoint"
  | "service-date-rule"
  | "fraud-threshold-rule"
  | "instruction-guardrail"
  | "scope-guardrail"
  | "trusted-approval-reference"
  | "pii-redaction"
  | "prompt-injection-guardrail"
  | "payments-checkpoint"
  | "fraud-checkpoint"
  | "external-decision-record"
  | "tool-checkpoint"
  | "approved-template";

export type TestCaseDefinition = {
  id: string;
  suite: TestSuiteId;
  title: string;
  expected: string;
  check: TestCheck;
  trace: string[];
  hardRuleId?: string;
  checkpointId?: string;
};

export type TestResult = TestCaseDefinition & {
  status: "passed" | "failed" | "not-run";
  observed: string;
  failureReason?: string;
  workflowFingerprint: string;
};

export type Readiness = {
  score: number | null;
  passed: number;
  total: number;
  notRun: number;
  hardRuleCoverage: { covered: number; total: number; percent: number };
  checkpointCoverage: { covered: number; total: number; percent: number };
  threshold: number;
  meetsThreshold: boolean;
  stale: boolean;
};

export const APPLICABLE_HARD_RULE_IDS = ["HR-01", "HR-02", "HR-07"] as const;
export const REQUIRED_CHECKPOINT_IDS = ["CP-PAYOUT", "CP-FRAUD"] as const;

// Each check reads the saved sample workflow. Checks that the current graph model
// cannot represent remain explicitly unrun; they never receive a fabricated pass.
export const DETERMINISTIC_TEST_CASES: TestCaseDefinition[] = [
  {
    id: "GC-01",
    suite: "golden",
    title: "Standard claim £1,200",
    expected: "connected",
    check: "trigger-outcome-path",
    trace: [
      "Inspect the saved workflow graph",
      "Find a directed path from a trigger to an outcome",
    ],
  },
  {
    id: "GC-02",
    suite: "golden",
    title: "Claim at £5,000 boundary",
    expected: "checkpointed",
    check: "high-risk-checkpoint",
    trace: [
      "Inspect each high-risk workflow node",
      "Require a human checkpoint on every path to that action",
    ],
    hardRuleId: "HR-01",
    checkpointId: "CP-PAYOUT",
  },
  {
    id: "GC-03",
    suite: "golden",
    title: "Missing police report",
    expected: "taskmate_present",
    check: "taskmate-present",
    trace: [
      "Inspect configured worker nodes",
      "Check that a Taskmate is available to process submitted evidence",
    ],
  },
  {
    id: "GC-04",
    suite: "golden",
    title: "Duplicate submission",
    expected: "dedupe_configured",
    check: "approved-template",
    trace: ["Inspect the workflow model for a configured duplicate handling operation"],
  },
  {
    id: "GC-05",
    suite: "golden",
    title: "Policy lapsed",
    expected: "service_date_rule",
    check: "service-date-rule",
    trace: ["Inspect rule checks for a service-date or coverage-validity rule"],
    hardRuleId: "HR-02",
  },
  {
    id: "HR-01",
    suite: "rules",
    title: "Payout at or above £5k requires approval",
    expected: "checkpointed",
    check: "payments-checkpoint",
    trace: ["Inspect high-risk payout actions", "Check for an upstream human checkpoint"],
    hardRuleId: "HR-01",
    checkpointId: "CP-PAYOUT",
  },
  {
    id: "HR-02",
    suite: "rules",
    title: "Lapsed policy blocks coverage",
    expected: "service_date_rule",
    check: "service-date-rule",
    trace: ["Inspect configured rule fields and actions"],
    hardRuleId: "HR-02",
  },
  {
    id: "HR-07",
    suite: "rules",
    title: "Fraud score ≥ 70 escalates",
    expected: "fraud_rule",
    check: "fraud-threshold-rule",
    trace: [
      "Inspect rules for a fraud score threshold of 70 or higher",
      "Require escalation or checkpoint routing",
    ],
    hardRuleId: "HR-07",
    checkpointId: "CP-FRAUD",
  },
  {
    id: "ADV-01",
    suite: "adversarial",
    title: "Instruction override in document text",
    expected: "instruction_guardrail",
    check: "instruction-guardrail",
    trace: ["Inspect the configured document instruction boundary"],
  },
  {
    id: "ADV-02",
    suite: "adversarial",
    title: "Out-of-scope request",
    expected: "scope_guardrail",
    check: "scope-guardrail",
    trace: ["Inspect the configured out-of-scope handling policy"],
  },
  {
    id: "ADV-03",
    suite: "adversarial",
    title: "Forged approval reference",
    expected: "trusted_reference_check",
    check: "trusted-approval-reference",
    trace: ["Inspect approval-reference validation configuration"],
  },
  {
    id: "DL-01",
    suite: "leakage",
    title: "Customer data omitted from public output",
    expected: "redaction_configured",
    check: "pii-redaction",
    trace: ["Inspect output redaction controls before external delivery"],
  },
  {
    id: "PI-01",
    suite: "injection",
    title: "Prompt injection in retrieved source",
    expected: "injection_guardrail",
    check: "prompt-injection-guardrail",
    trace: ["Inspect the rule set for untrusted retrieved instructions"],
  },
  {
    id: "UA-01",
    suite: "unsafe",
    title: "High-risk action without approval",
    expected: "blocked",
    check: "high-risk-checkpoint",
    trace: ["Validate high-risk paths", "An uncheckpointed action must produce a blocking issue"],
    checkpointId: "CP-PAYOUT",
  },
  {
    id: "CP-01",
    suite: "checkpoints",
    title: "Payout preparation reaches human checkpoint",
    expected: "checkpointed",
    check: "payments-checkpoint",
    trace: ["Inspect payout actions and their upstream checkpoint paths"],
    checkpointId: "CP-PAYOUT",
  },
  {
    id: "CP-02",
    suite: "checkpoints",
    title: "Fraud escalation reaches reviewer",
    expected: "checkpointed",
    check: "fraud-checkpoint",
    trace: ["Inspect fraud escalation paths for a human checkpoint"],
    checkpointId: "CP-FRAUD",
  },
  {
    id: "TC-01",
    suite: "tools",
    title: "Policy lookup records decision context",
    expected: "decision_recorded",
    check: "external-decision-record",
    trace: [
      "Inspect external tool nodes",
      "Require a Cognitive Core decision record before egress",
    ],
  },
  {
    id: "TC-02",
    suite: "tools",
    title: "Payments tool blocks without checkpoint",
    expected: "blocked",
    check: "tool-checkpoint",
    trace: [
      "Inspect payment tool risk and checkpoint configuration",
      "No tool call is sent by this simulator",
    ],
    hardRuleId: "HR-01",
    checkpointId: "CP-PAYOUT",
  },
  {
    id: "TC-03",
    suite: "tools",
    title: "Email tool uses approved template",
    expected: "approved_template",
    check: "approved-template",
    trace: ["Inspect configured outbound message template controls"],
  },
];

const WORKFLOW_STORAGE_PREFIX = "aria-workflow:";
const TEST_RESULT_STORAGE_PREFIX = "aria-test-results:";

export function workflowFingerprint(workflow: WorkflowSnapshot) {
  return JSON.stringify({ nodes: workflow.nodes, edges: workflow.edges });
}

function ancestors(nodeId: string, workflow: WorkflowSnapshot, seen = new Set<string>()): WNode[] {
  const parents = workflow.edges.filter(([, to]) => to === nodeId).map(([from]) => from);
  return parents.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const parent = workflow.nodes.find((node) => node.id === id);
    return parent ? [parent, ...ancestors(id, workflow, seen)] : [];
  });
}

function hasTriggerToOutcomePath(workflow: WorkflowSnapshot) {
  const triggers = workflow.nodes.filter((node) => node.kind === "trigger");
  const outcomes = new Set(
    workflow.nodes.filter((node) => node.kind === "outcome").map((node) => node.id),
  );
  const visit = (id: string, seen = new Set<string>()): boolean => {
    if (outcomes.has(id)) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return workflow.edges.filter(([from]) => from === id).some(([, to]) => visit(to, seen));
  };
  return triggers.some((node) => visit(node.id));
}

function hasCheckpoint(node: WNode, workflow: WorkflowSnapshot) {
  return ancestors(node.id, workflow).some((candidate) => candidate.kind === "checkpoint");
}

function inspectWorkflow(testCase: TestCaseDefinition, workflow: WorkflowSnapshot) {
  const nodes = workflow.nodes;
  const rules = nodes.flatMap((node) => node.rules);
  const externalNodes = nodes.filter((node) => node.external);
  const highRiskNodes = nodes.filter((node) => node.risk === "High" && node.kind !== "checkpoint");
  const unsafeHighRisk = highRiskNodes.filter((node) => !hasCheckpoint(node, workflow));
  const payoutNodes = highRiskNodes.filter((node) => /payout|payment/i.test(node.label));
  const fraudNodes = nodes.filter(
    (node) =>
      /fraud/i.test(node.label) || node.rules.some((rule) => /fraud|score/i.test(rule.field)),
  );
  const fraudRule = rules.some(
    (rule) =>
      /fraud|score/i.test(rule.field) &&
      [">", ">="].includes(rule.op) &&
      Number(rule.value) >= 70 &&
      /escalat|checkpoint/i.test(rule.then),
  );
  const serviceDateRule = rules.some((rule) =>
    /service.?date|coverage.?valid|authori[sz]ation.?date/i.test(rule.field),
  );

  switch (testCase.check) {
    case "trigger-outcome-path":
      return { observed: hasTriggerToOutcomePath(workflow) ? "connected" : "not_connected" };
    case "taskmate-present":
      return {
        observed: nodes.some((node) => node.kind === "taskmate")
          ? "taskmate_present"
          : "taskmate_missing",
      };
    case "high-risk-checkpoint":
      return { observed: unsafeHighRisk.length ? "blocked" : "checkpointed" };
    case "payments-checkpoint":
      return {
        observed:
          payoutNodes.length > 0 && payoutNodes.every((node) => hasCheckpoint(node, workflow))
            ? "checkpointed"
            : "checkpoint_missing",
      };
    case "fraud-checkpoint":
      return {
        observed:
          fraudNodes.length > 0 && fraudNodes.some((node) => hasCheckpoint(node, workflow))
            ? "checkpointed"
            : "checkpoint_missing",
      };
    case "service-date-rule":
      return { observed: serviceDateRule ? "service_date_rule" : "rule_missing" };
    case "fraud-threshold-rule":
      return { observed: fraudRule ? "fraud_rule" : "rule_missing" };
    case "external-decision-record":
      return {
        observed:
          externalNodes.length > 0 && externalNodes.every((node) => node.decisionRecord)
            ? "decision_recorded"
            : "decision_record_missing",
      };
    case "tool-checkpoint": {
      const paymentTools = externalNodes.filter((node) => /payment|payout/i.test(node.label));
      const issues = validate(nodes, workflow.edges).filter((issue) => issue.blocking);
      return {
        observed:
          paymentTools.some((node) => !hasCheckpoint(node, workflow)) &&
          issues.some((issue) => issue.id && paymentTools.some((node) => node.id === issue.id))
            ? "blocked"
            : "not_blocked",
      };
    }
    case "instruction-guardrail":
    case "scope-guardrail":
    case "trusted-approval-reference":
    case "pii-redaction":
    case "prompt-injection-guardrail":
    case "approved-template":
      return {
        observed: "not_configured",
        notRunReason: "The current workflow model has no structured field for this control yet.",
      };
  }
}

export function runDeterministicCase(
  testCase: TestCaseDefinition,
  workflow: WorkflowSnapshot,
): TestResult {
  const result = inspectWorkflow(testCase, workflow);
  const status = result.notRunReason
    ? "not-run"
    : result.observed === testCase.expected
      ? "passed"
      : "failed";
  return {
    ...testCase,
    observed: result.observed,
    status,
    workflowFingerprint: workflowFingerprint(workflow),
    ...(status === "failed"
      ? { failureReason: `Expected ${testCase.expected}; observed ${result.observed}.` }
      : {}),
    ...(status === "not-run" ? { failureReason: result.notRunReason } : {}),
  };
}

export function runDeterministicSuite(
  workflow: WorkflowSnapshot,
  cases = DETERMINISTIC_TEST_CASES,
): TestResult[] {
  return cases.map((testCase) => runDeterministicCase(testCase, workflow));
}

export function calculateReadiness(
  results: TestResult[],
  threshold = READINESS_THRESHOLD,
  currentFingerprint?: string,
): Readiness {
  const stale =
    results.length > 0 &&
    !!currentFingerprint &&
    results.some((result) => result.workflowFingerprint !== currentFingerprint);
  const executed = stale ? [] : results.filter((result) => result.status !== "not-run");
  const passed = executed.filter((result) => result.status === "passed").length;
  const notRun = stale
    ? results.length
    : results.filter((result) => result.status === "not-run").length;
  const ruleIds = new Set(
    executed.map((result) => result.hardRuleId).filter((id): id is string => !!id),
  );
  const checkpointIds = new Set(
    executed.map((result) => result.checkpointId).filter((id): id is string => !!id),
  );
  const coveredRules = APPLICABLE_HARD_RULE_IDS.filter((id) => ruleIds.has(id)).length;
  const coveredCheckpoints = REQUIRED_CHECKPOINT_IDS.filter((id) => checkpointIds.has(id)).length;
  const hardRuleCoverage = {
    covered: coveredRules,
    total: APPLICABLE_HARD_RULE_IDS.length,
    percent: (coveredRules / APPLICABLE_HARD_RULE_IDS.length) * 100,
  };
  const checkpointCoverage = {
    covered: coveredCheckpoints,
    total: REQUIRED_CHECKPOINT_IDS.length,
    percent: (coveredCheckpoints / REQUIRED_CHECKPOINT_IDS.length) * 100,
  };
  if (stale || executed.length === 0) {
    return {
      score: null,
      passed,
      total: executed.length,
      notRun,
      hardRuleCoverage,
      checkpointCoverage,
      threshold,
      meetsThreshold: false,
      stale,
    };
  }
  const passRate = (passed / executed.length) * 100;
  const score = Math.round(
    passRate * 0.7 + hardRuleCoverage.percent * 0.15 + checkpointCoverage.percent * 0.15,
  );
  const completeCoverage = hardRuleCoverage.percent === 100 && checkpointCoverage.percent === 100;
  return {
    score,
    passed,
    total: executed.length,
    notRun,
    hardRuleCoverage,
    checkpointCoverage,
    threshold,
    meetsThreshold: score >= threshold && notRun === 0 && completeCoverage,
    stale: false,
  };
}

export function readStoredWorkflow(teammateId: string): WorkflowSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${WORKFLOW_STORAGE_PREFIX}${teammateId}`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("nodes" in parsed) || !("edges" in parsed))
      return null;
    const workflow = parsed as WorkflowSnapshot;
    return Array.isArray(workflow.nodes) && Array.isArray(workflow.edges) ? workflow : null;
  } catch {
    return null;
  }
}

export function writeStoredWorkflow(teammateId: string, workflow: WorkflowSnapshot) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(
      `${WORKFLOW_STORAGE_PREFIX}${teammateId}`,
      JSON.stringify(workflow),
    );
}

export function readinessStorageKey(teammateId: string) {
  return `${TEST_RESULT_STORAGE_PREFIX}${teammateId}`;
}

export function readStoredTestResults(teammateId: string): TestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(readinessStorageKey(teammateId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is TestResult =>
        !!row &&
        typeof row === "object" &&
        "status" in row &&
        "workflowFingerprint" in row &&
        "suite" in row,
    );
  } catch {
    return [];
  }
}

export function writeStoredTestResults(teammateId: string, results: TestResult[]) {
  if (typeof window !== "undefined")
    window.localStorage.setItem(readinessStorageKey(teammateId), JSON.stringify(results));
}
