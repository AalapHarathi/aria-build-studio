import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SampleTag } from "@/components/aria/ui";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/operate")({ head: () => seo("Operate", "Runtime operations destination, separate from Build Studio."), component: () => (
  <div><PageHeader eyebrow="Separate destination" title="Operate" desc="Runtime monitoring of live Teammates lives in the Operate console, outside Build Studio." actions={<SampleTag>Placeholder</SampleTag>} />
  <div className="p-8"><Panel><p className="text-sm text-muted-foreground">This prototype covers building and shipping. Operate (run monitoring, incident handling, human checkpoint inbox) is a separate product destination and is not simulated here.</p></Panel></div></div>) });
