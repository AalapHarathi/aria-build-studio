import { describe, expect, it } from "vitest";
import {
  calculateReadiness,
  runDeterministicCase,
  runDeterministicSuite,
  type TestCaseDefinition,
} from "@/lib/aria-validation";

describe("deterministic test evaluation and readiness", () => {
  it("does not report readiness before any test results exist", () => {
    expect(calculateReadiness([])).toMatchObject({
      score: null,
      passed: 0,
      total: 0,
      meetsThreshold: false,
    });
  });

  it("compares expected and observed values and keeps a failure reason", () => {
    const sample: TestCaseDefinition = {
      id: "T-01",
      suite: "golden",
      title: "Boundary case",
      expected: "checkpoint",
      observed: "continue",
      trace: ["Rule evaluated"],
    };
    expect(runDeterministicCase(sample)).toMatchObject({
      passed: false,
      failureReason: "Expected checkpoint; observed continue.",
    });
  });

  it("calculates the score and coverage from executed cases", () => {
    const results = runDeterministicSuite();
    const readiness = calculateReadiness(results);
    expect(readiness.total).toBe(results.length);
    expect(readiness.passed).toBe(results.filter((result) => result.passed).length);
    expect(readiness.hardRuleCoverage).toMatchObject({ covered: 3, total: 3, percent: 100 });
    expect(readiness.checkpointCoverage).toMatchObject({ covered: 2, total: 2, percent: 100 });
    expect(readiness.score).toBe(Math.round((readiness.passed / readiness.total) * 70 + 15 + 15));
  });
});
