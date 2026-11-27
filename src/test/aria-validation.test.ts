import { describe, expect, it } from "vitest";
import { INITIAL_EDGES, INITIAL_NODES } from "@/components/aria/workflow-builder";
import {
  calculateReadiness,
  DETERMINISTIC_TEST_CASES,
  runDeterministicSuite,
  workflowFingerprint,
  type WorkflowSnapshot,
} from "@/lib/aria-validation";

const starter: WorkflowSnapshot = { nodes: INITIAL_NODES, edges: INITIAL_EDGES };

describe("workflow-backed deterministic evaluation", () => {
  it("does not report readiness before current test results exist", () => {
    expect(calculateReadiness([])).toMatchObject({
      score: null,
      passed: 0,
      total: 0,
      meetsThreshold: false,
    });
  });

  it("observes an uncheckpointed high-risk action in the actual graph", () => {
    const result = runDeterministicSuite(starter).find((item) => item.id === "HR-01");
    expect(result).toMatchObject({ status: "failed", observed: "checkpoint_missing" });
    expect(result?.failureReason).toContain("Expected checkpointed");
  });

  it("changes the check result when the workflow adds an upstream checkpoint", () => {
    const checkpoint = {
      ...INITIAL_NODES[6],
      id: "n9",
      kind: "checkpoint" as const,
      label: "Payout approval",
    };
    const safe: WorkflowSnapshot = {
      nodes: [...INITIAL_NODES, checkpoint],
      edges: [
        ...INITIAL_EDGES.filter(([from, to]) => !(from === "n4" && to === "n5")),
        ["n4", "n9"],
        ["n9", "n5"],
      ],
    };
    const result = runDeterministicSuite(safe).find((item) => item.id === "HR-01");
    expect(result).toMatchObject({ status: "passed", observed: "checkpointed" });
  });

  it("marks controls unsupported by the graph model as not run", () => {
    const result = runDeterministicSuite(starter).find((item) => item.id === "ADV-01");
    expect(result).toMatchObject({ status: "not-run", observed: "not_configured" });
    expect(result?.failureReason).toContain("no structured field");
  });

  it("treats results from an older workflow fingerprint as stale", () => {
    const results = runDeterministicSuite(starter);
    const readiness = calculateReadiness(
      results,
      undefined,
      workflowFingerprint({ nodes: [], edges: [] }),
    );
    expect(readiness).toMatchObject({ stale: true, score: null, meetsThreshold: false });
  });

  it("requires all checks to be executed before the threshold can pass", () => {
    const results = runDeterministicSuite(starter);
    expect(results.some((result) => result.status === "not-run")).toBe(true);
    expect(
      calculateReadiness(results, undefined, workflowFingerprint(starter)).meetsThreshold,
    ).toBe(false);
    expect(DETERMINISTIC_TEST_CASES.length).toBe(results.length);
  });
});
