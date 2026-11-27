import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, Pill, RiskPill, SampleTag } from "@/components/aria/ui";
import { REVIEWS, ROLES, type Review } from "@/lib/aria-data";
import { useApp } from "@/lib/app-state";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reviews")({
  validateSearch: (search: Record<string, unknown>) => ({
    reviewId: typeof search.reviewId === "string" ? search.reviewId : undefined,
  }),
  head: () =>
    seo(
      "Review Queue",
      "Review diffs, pin comments and approve or request changes with separation of duties.",
    ),
  component: Reviews,
});

const DIFF = [
  { t: " ", s: "section: governance" },
  { t: "-", s: "  autonomy: Supervised" },
  { t: "+", s: "  autonomy: Copilot" },
  { t: " ", s: "workflow:" },
  { t: " ", s: "  - taskmate: Identity Verification@1.0.4" },
  { t: "+", s: "  - checkpoint: Senior KYC Analyst (SLA 4h)" },
  { t: "+", s: "    required_for: risk >= High" },
  { t: " ", s: "rules:" },
  { t: "-", s: "  R-07: IF pep_match THEN escalate" },
  { t: "+", s: "  R-07: IF pep_match OR sanctions_hit THEN escalate(compliance)" },
];

function Reviews() {
  const { reviewId } = Route.useSearch();
  const { role } = useApp();
  const me = ROLES[role].person;
  const [items, setItems] = useState<Review[]>(REVIEWS);
  const [filter, setFilter] = useState<"all" | Review["status"]>("all");
  const [selId, setSelId] = useState(reviewId ?? REVIEWS[0]!.id);
  useEffect(() => {
    if (reviewId && items.some((item) => item.id === reviewId)) setSelId(reviewId);
  }, [reviewId, items]);
  const [comments, setComments] = useState<{ line: number; who: string; text: string }[]>([
    { line: 6, who: "Dr. Omar Haddad", text: "Confirm SLA aligns with compliance policy CP-12." },
  ]);
  const [pinLine, setPinLine] = useState<number | null>(null);
  const [text, setText] = useState("");
  const sel = items.find((i) => i.id === selId)!;
  const isAuthor = sel.author === me;
  const canDecide = role === "reviewer" && !isAuthor && sel.status === "Awaiting review";
  const decide = (status: Review["status"]) => {
    setItems(items.map((i) => (i.id === sel.id ? { ...i, status } : i)));
    toast.success(`${sel.id}: ${status} (simulated)`);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Ship"
        title="Review Queue"
        desc="Domain experts review versioned diffs. Authors cannot approve their own work."
        actions={<SampleTag />}
      />
      <div className="grid gap-6 p-8 xl:grid-cols-[340px_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {(["all", "Awaiting review", "Changes requested", "Approved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  filter === f
                    ? "border-primary bg-blue-soft text-primary"
                    : "text-muted-foreground",
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          {items
            .filter((i) => filter === "all" || i.status === filter)
            .map((i) => (
              <button
                key={i.id}
                onClick={() => setSelId(i.id)}
                className={cn(
                  "w-full rounded-lg border bg-card p-3 text-left",
                  selId === i.id && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{i.id}</span>
                  <span>{i.submitted}</span>
                </div>
                <div className="mt-1 text-sm font-medium">{i.title}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Pill
                    tone={
                      i.status === "Approved"
                        ? "teal"
                        : i.status === "Changes requested"
                          ? "warn"
                          : "blue"
                    }
                  >
                    {i.status}
                  </Pill>
                  <RiskPill risk={i.risk} />
                </div>
              </button>
            ))}
        </div>
        <div className="space-y-4">
          <Panel
            title={
              <span>
                {sel.title}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {sel.from} → {sel.to}
                </span>
              </span>
            }
            action={<span className="text-xs text-muted-foreground">Author: {sel.author}</span>}
          >
            <div className="overflow-hidden rounded-md border font-mono text-xs">
              {DIFF.map((d, n) => (
                <div key={n}>
                  <div
                    onClick={() => setPinLine(n)}
                    className={cn(
                      "group flex cursor-pointer",
                      d.t === "+" && "bg-teal-soft",
                      d.t === "-" && "bg-danger-soft",
                    )}
                  >
                    <span className="w-10 shrink-0 select-none border-r px-2 text-right text-muted-foreground">
                      {n + 1}
                    </span>
                    <span className="w-5 text-center">{d.t}</span>
                    <span className="flex-1 whitespace-pre">{d.s}</span>
                    <MessageSquare className="mr-2 mt-0.5 h-3.5 w-3.5 opacity-0 group-hover:opacity-60" />
                  </div>
                  {comments
                    .filter((c) => c.line === n)
                    .map((c, k) => (
                      <div
                        key={k}
                        className="border-y bg-warning-soft px-12 py-2 font-sans text-xs"
                      >
                        <b>{c.who}</b>: {c.text}
                      </div>
                    ))}
                  {pinLine === n && (
                    <div className="space-y-2 border-y bg-muted p-3 font-sans">
                      <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Pin a comment to line ${n + 1}`}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={!text}
                          onClick={() => {
                            setComments([...comments, { line: n, who: me, text }]);
                            setText("");
                            setPinLine(null);
                          }}
                        >
                          Pin comment
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPinLine(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Decision">
            {role !== "reviewer" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                Only Domain Expert / Reviewer can decide. Switch role to review.
              </p>
            ) : isAuthor ? (
              <p className="text-sm text-destructive">
                You authored this change — separation of duties prevents self-approval.
              </p>
            ) : sel.status !== "Awaiting review" ? (
              <p className="text-sm text-muted-foreground">Decision recorded: {sel.status}.</p>
            ) : (
              <div className="flex gap-2">
                <Button disabled={!canDecide} onClick={() => decide("Approved")}>
                  Approve
                </Button>
                <Button variant="outline" onClick={() => decide("Changes requested")}>
                  Request changes
                </Button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
