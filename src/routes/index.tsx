import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StageBadge, Stat, SampleTag, Pill } from "@/components/aria/ui";
import { BUNDLES, ENGINES, LIFECYCLE, RECENT_CHANGES, REVIEWS, TEAMMATES, ROLES } from "@/lib/aria-data";
import { useApp } from "@/lib/app-state";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Studio Overview", "Lifecycle, active bundle, engine health and reviews across your Teammates."),
  component: Overview,
});

const checklist = [
  { label: "Pin an Aria Core bundle", done: true },
  { label: "Register tools in Control Centre", done: true },
  { label: "Define hard rules in Governance Sentinel", done: true },
  { label: "Publish first reusable Taskmate", done: true },
  { label: "Create golden case suite", done: false },
  { label: "Assign domain reviewers", done: false },
];

function Overview() {
  const { role } = useApp();
  const bundle = BUNDLES[0];
  const myReviews = REVIEWS.filter((r) => r.status === "Awaiting review");
  return (
    <div>
      <PageHeader
        eyebrow="Build"
        title="Studio Overview"
        desc={`Signed in as ${ROLES[role].label}. ${ROLES[role].blurb}.`}
        actions={<>
          <SampleTag />
          {role === "builder" && <Button asChild><Link to="/teammate-studio"><Plus className="h-4 w-4" /> New Teammate</Link></Button>}
          {role === "reviewer" && <Button asChild><Link to="/reviews">Open review queue</Link></Button>}
          {role === "operator" && <Button asChild><Link to="/releases">Manage releases</Link></Button>}
        </>}
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {LIFECYCLE.map((s) => (
            <Stat key={s} label={s} value={TEAMMATES.filter((t) => t.stage === s).length} sub={<StageBadge stage={s} />} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Active bundle" action={<Pill tone="teal">{bundle.status}</Pill>}>
            <div className="text-sm font-semibold">{bundle.name}</div>
            <div className="mb-3 text-xs text-muted-foreground">Explicitly pinned engine versions — no floating ranges.</div>
            <dl className="divide-y text-sm">
              {Object.entries(bundle.pinned).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-xs">{v}</dd></div>
              ))}
            </dl>
          </Panel>

          <Panel title="Recent changes" className="xl:col-span-2">
            <ul className="divide-y">
              {RECENT_CHANGES.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div><span className="font-medium">{c.who}</span> <span className="text-muted-foreground">· {c.what}</span> <span className="text-primary">· {c.target}</span></div>
                  <span className="shrink-0 text-xs text-muted-foreground">{c.when}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Aria Core engines">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ENGINES.map((e) => (
              <Link key={e.slug} to="/core/$engine" params={{ engine: e.slug }} className="group rounded-md border p-3 transition-colors hover:border-primary">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{e.name}</div>
                  <span className="font-mono text-[11px] text-muted-foreground">v{bundle.pinned[e.name]}</span>
                </div>
                <div className="text-xs text-muted-foreground">{e.short}</div>
                <div className="mt-2 text-xs">{e.summary}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-teal">{e.metric}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" /></div>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Setup checklist" action={<span className="text-xs text-muted-foreground">{checklist.filter((c) => c.done).length}/{checklist.length} complete</span>}>
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done ? <CheckCircle2 className="h-4 w-4 text-teal" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                  {!c.done && <button onClick={() => toast("Simulated: opened setup step", { description: c.label })} className="ml-auto text-xs text-primary hover:underline">Start</button>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Reviews assigned to Dr. Omar Haddad" action={<Link to="/reviews" className="text-xs text-primary hover:underline">View all</Link>}>
            <ul className="divide-y">
              {myReviews.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.id} · by {r.author} · {r.submitted}</div></div>
                  <Pill tone={r.risk === "High" ? "danger" : "warn"}>{r.risk} risk</Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
