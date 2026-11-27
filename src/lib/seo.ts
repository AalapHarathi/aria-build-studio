export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} · ARIA XAI Build Studio` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · ARIA XAI Build Studio` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
