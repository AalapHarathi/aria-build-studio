import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SampleTag } from "@/components/aria/ui";
import { seo } from "@/lib/seo";
export const Route = createFileRoute("/control-centre")({ head: () => seo("Control Centre", "Tenant administration destination, separate from Build Studio."), component: () => (
  <div><PageHeader eyebrow="Separate destination" title="Control Centre" desc="Tenant settings, tool registry, identity and access are managed in Control Centre." actions={<SampleTag>Placeholder</SampleTag>} />
  <div className="p-8"><Panel><p className="text-sm text-muted-foreground">Control Centre is a separate destination. Tools referenced in Build Studio are registered there; in this prototype all tool connections are sample entries only.</p></Panel></div></div>) });
