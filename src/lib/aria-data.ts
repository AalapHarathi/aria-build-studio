// SAMPLE DATA — illustrative only. No real integrations, deployments or users.
export type Role = "builder" | "reviewer" | "operator";
export const ROLES: Record<Role, { label: string; person: string; initials: string; blurb: string }> = {
  builder: { label: "Builder", person: "Maya Chen", initials: "MC", blurb: "Designs Teammates and Taskmates, submits for review" },
  reviewer: { label: "Domain Expert / Reviewer", person: "Dr. Omar Haddad", initials: "OH", blurb: "Reviews diffs, approves or requests changes" },
  operator: { label: "Platform Operator", person: "Priya Raman", initials: "PR", blurb: "Promotes releases, runs health checks, rolls back" },
};

export const LIFECYCLE = ["Draft", "In review", "Approved", "Staged", "Canary", "Production"] as const;
export type Stage = (typeof LIFECYCLE)[number];

export type Teammate = { id: string; name: string; outcome: string; stage: Stage; autonomy: "Copilot" | "Supervised" | "Autonomous"; owner: string; version: string; readiness: number; updated: string; taskmates: number };
export const TEAMMATES: Teammate[] = [
  { id: "tm-claims", name: "Claims Resolution Teammate", outcome: "Resolve motor claims under £5k within 48h", stage: "Draft", autonomy: "Copilot", owner: "Maya Chen", version: "0.4.0-draft", readiness: 72, updated: "12 min ago", taskmates: 5 },
  { id: "tm-kyc", name: "KYC Onboarding Teammate", outcome: "Complete retail KYC with zero policy breaches", stage: "In review", autonomy: "Copilot", owner: "Maya Chen", version: "1.2.0-rc1", readiness: 88, updated: "1 h ago", taskmates: 4 },
  { id: "tm-ap", name: "Invoice Exceptions Teammate", outcome: "Clear AP exceptions under 3 days", stage: "Approved", autonomy: "Supervised", owner: "Leo Martins", version: "2.0.0", readiness: 91, updated: "Yesterday", taskmates: 6 },
  { id: "tm-supply", name: "Supplier Risk Teammate", outcome: "Flag tier-1 supplier risk within 24h", stage: "Staged", autonomy: "Supervised", owner: "Aiko Tan", version: "1.5.1", readiness: 93, updated: "2 d ago", taskmates: 3 },
  { id: "tm-care", name: "Care Plan Teammate", outcome: "Prepare care plans for clinician sign-off", stage: "Canary", autonomy: "Copilot", owner: "Leo Martins", version: "3.1.0", readiness: 95, updated: "3 d ago", taskmates: 4 },
  { id: "tm-refund", name: "Refund Desk Teammate", outcome: "Process refunds under policy within SLA", stage: "Production", autonomy: "Supervised", owner: "Aiko Tan", version: "4.2.3", readiness: 97, updated: "1 w ago", taskmates: 5 },
  { id: "tm-dispute", name: "Card Dispute Teammate", outcome: "Triage chargebacks to resolution path", stage: "Production", autonomy: "Supervised", owner: "Maya Chen", version: "2.8.0", readiness: 96, updated: "2 w ago", taskmates: 4 },
];

export type Taskmate = { id: string; name: string; purpose: string; inputs: string[]; outputs: string[]; risk: "Low" | "Medium" | "High"; version: string; usedBy: number; custom?: boolean; tools: string[] };
export const TASKMATES: Taskmate[] = [
  { id: "tk-intake", name: "Document Intake", purpose: "Extract structured fields from submitted documents", inputs: ["document_ref"], outputs: ["fields{}", "confidence"], risk: "Low", version: "2.1.0", usedBy: 9, tools: ["OCR Service (sample)"] },
  { id: "tk-policy", name: "Policy Check", purpose: "Evaluate claim against coverage rules", inputs: ["policy_id", "claim{}"], outputs: ["covered:boolean", "clauses[]"], risk: "Medium", version: "1.4.2", usedBy: 6, tools: ["Policy API (sample)"] },
  { id: "tk-fraud", name: "Fraud Signals", purpose: "Score claim against fraud indicators", inputs: ["claim{}"], outputs: ["score:0-100", "signals[]"], risk: "Medium", version: "3.0.0", usedBy: 4, tools: ["Risk MCP (sample)"] },
  { id: "tk-payout", name: "Payout Preparation", purpose: "Prepare payment instruction for approval", inputs: ["amount", "payee"], outputs: ["instruction_id"], risk: "High", version: "1.1.0", usedBy: 3, tools: ["Payments API (sample)"] },
  { id: "tk-notify", name: "Customer Notification", purpose: "Draft and send templated customer updates", inputs: ["customer_id", "template"], outputs: ["message_id"], risk: "Medium", version: "2.3.1", usedBy: 11, tools: ["Email MCP (sample)"] },
  { id: "tk-kyc", name: "Identity Verification", purpose: "Verify identity documents against registry", inputs: ["id_doc"], outputs: ["verified:boolean"], risk: "High", version: "1.0.4", usedBy: 2, tools: ["IDV API (sample)"] },
  { id: "tk-summ", name: "Case Summary", purpose: "Produce deterministic case summary template", inputs: ["case{}"], outputs: ["summary"], risk: "Low", version: "1.2.0", usedBy: 8, custom: true, tools: [] },
];

export const ENGINES = [
  { slug: "cognitive-core", name: "Cognitive Core", short: "Reasoning & decision records", color: "primary", summary: "14 reasoning policies · 3 decision record templates", metric: "100% external actions recorded" },
  { slug: "motivation-engine", name: "Motivation Engine", short: "Goals, priorities & outcomes", color: "teal", summary: "22 goal definitions · 6 priority schemes", metric: "8 outcome KPIs tracked" },
  { slug: "knowledge-fabric", name: "Knowledge Fabric", short: "Sources, retrieval & memory", color: "violet", summary: "31 sources · 4 memory scopes", metric: "98.2% source freshness" },
  { slug: "swarm-orchestrator", name: "Swarm Orchestrator", short: "Taskmate delegation & flow", color: "primary", summary: "47 Taskmates · 12 workflow templates", metric: "0 unresolved handoffs" },
  { slug: "anthropomorphic-interface", name: "Anthropomorphic Interface", short: "Persona, tone & channels", color: "teal", summary: "9 personas · 4 channels", metric: "3 accessibility profiles" },
  { slug: "governance-sentinel", name: "Governance Sentinel", short: "Policy, autonomy & audit", color: "violet", summary: "58 hard rules · 11 checkpoint policies", metric: "0 open violations" },
] as const;
export type EngineSlug = (typeof ENGINES)[number]["slug"];

export const BUNDLES = [
  { id: "aria-2026.11", name: "Aria Core Bundle 2026.11", status: "Active", pinned: { "Cognitive Core": "4.2.1", "Motivation Engine": "2.0.3", "Knowledge Fabric": "5.1.0", "Swarm Orchestrator": "3.4.2", "Anthropomorphic Interface": "1.9.0", "Governance Sentinel": "6.0.1" } },
  { id: "aria-2026.10", name: "Aria Core Bundle 2026.10", status: "Supported", pinned: { "Cognitive Core": "4.1.0", "Motivation Engine": "2.0.1", "Knowledge Fabric": "5.0.2", "Swarm Orchestrator": "3.3.0", "Anthropomorphic Interface": "1.8.4", "Governance Sentinel": "5.9.0" } },
  { id: "aria-2026.12-rc", name: "Aria Core Bundle 2026.12 RC", status: "Preview", pinned: { "Cognitive Core": "4.3.0-rc", "Motivation Engine": "2.1.0-rc", "Knowledge Fabric": "5.2.0-rc", "Swarm Orchestrator": "3.5.0-rc", "Anthropomorphic Interface": "2.0.0-rc", "Governance Sentinel": "6.1.0-rc" } },
] as const;

export const RECENT_CHANGES = [
  { who: "Maya Chen", what: "Added human checkpoint before Payout Preparation", target: "Claims Resolution", when: "12 min ago" },
  { who: "Leo Martins", what: "Promoted v3.1.0 to Canary (5%)", target: "Care Plan", when: "3 h ago" },
  { who: "Dr. Omar Haddad", what: "Requested changes on escalation rule R-07", target: "KYC Onboarding", when: "5 h ago" },
  { who: "Aiko Tan", what: "Pinned bundle aria-2026.11", target: "Supplier Risk", when: "Yesterday" },
  { who: "Priya Raman", what: "Health check passed (simulated)", target: "Refund Desk", when: "Yesterday" },
];

export type Review = { id: string; title: string; teammate: string; author: string; from: string; to: string; submitted: string; status: "Awaiting review" | "Changes requested" | "Approved"; risk: "Low" | "Medium" | "High"; assignee: string };
export const REVIEWS: Review[] = [
  { id: "RV-1042", title: "KYC Onboarding 1.2.0-rc1", teammate: "KYC Onboarding Teammate", author: "Maya Chen", from: "1.1.4", to: "1.2.0-rc1", submitted: "1 h ago", status: "Awaiting review", risk: "High", assignee: "Dr. Omar Haddad" },
  { id: "RV-1039", title: "Invoice Exceptions 2.0.0", teammate: "Invoice Exceptions Teammate", author: "Leo Martins", from: "1.9.2", to: "2.0.0", submitted: "Yesterday", status: "Approved", risk: "Medium", assignee: "Dr. Omar Haddad" },
  { id: "RV-1036", title: "Fraud Signals Taskmate 3.0.0", teammate: "Taskmate", author: "Aiko Tan", from: "2.4.0", to: "3.0.0", submitted: "2 d ago", status: "Changes requested", risk: "Medium", assignee: "Dr. Omar Haddad" },
  { id: "RV-1031", title: "Claims Resolution 0.4.0", teammate: "Claims Resolution Teammate", author: "Maya Chen", from: "0.3.2", to: "0.4.0", submitted: "3 d ago", status: "Awaiting review", risk: "High", assignee: "Dr. Omar Haddad" },
];

export const SECTIONS = [
  { id: "identity", title: "Identity and purpose", mandatory: true },
  { id: "responsibilities", title: "Responsibilities", mandatory: true },
  { id: "instructions", title: "Instructions and boundaries", mandatory: true },
  { id: "reasoning", title: "Reasoning", mandatory: true },
  { id: "knowledge", title: "Knowledge and memory", mandatory: false },
  { id: "tools", title: "Tools and integrations", mandatory: true },
  { id: "workflow", title: "Taskmate team and workflow", mandatory: true },
  { id: "persona", title: "Persona and interface", mandatory: false },
  { id: "governance", title: "Governance and autonomy", mandatory: true },
  { id: "testing", title: "Testing and evaluation", mandatory: true },
  { id: "versions", title: "Versions and deployment", mandatory: true },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];

export const READINESS_THRESHOLD = 85; // illustrative
