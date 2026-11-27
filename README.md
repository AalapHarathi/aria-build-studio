# Aria Build Studio

Create a polished, clickable enterprise SaaS prototype called ARIA XAI Build Studio. Use the uploaded Aria Build Studio components document as product source of truth. Design the application shell, Studio Overview, Teammate Studio with its 11 sections, Taskmate Studio, six individual Aria Core pages, Testing & Evaluation, Review Queue, and Bundles & Releases. Include Builder, Domain Expert/Reviewer, and Platform Operator role experiences. Build a working light/dark toggle. Use Precision Enterprise styling, balanced information density, Inter typography, navy #172C46, blue #4169E1, teal #16A58A, violet #8B83D6. Sidebar groups: Build (Studio Overview, Teammate Studio, Taskmate Studio), Aria Core (six engines), Ship (Testing & Evaluation, Review Queue, Bundles & Releases). Operate and Control Centre are separate destinations.

Critical: This is a deterministic visual agent-building platform. Do not create a conversational builder or LLM-dependent workflow generation. Use explicit structured forms, visual components, rules, and deterministic validation. Teammates own business outcomes and delegate to reusable Taskmates. Bundle selection is explicit and version-pinned. New Teammates start in Copilot and creation produces Draft only. Lifecycle: Draft, In review, Approved, Staged, Canary, Production. Builder cannot approve own work. High-risk actions require human checkpoints.

Teammate Studio has 11 sections: Identity and purpose; Responsibilities; Instructions and boundaries; Reasoning; Knowledge and memory; Tools and integrations; Taskmate team and workflow; Persona and interface; Governance and autonomy; Testing and evaluation; Versions and deployment. Include progress rail, autosave, mandatory/optional states and blocking validation reasons. Visual builder is three-panel: component library, interactive central workflow canvas, contextual inspector. Support drag-and-drop plus structured config, visual IF/THEN rules plus advanced rule editor, reusable Taskmates plus custom Taskmate creation. Include components for Taskmates, conditions, rule checks, parallel/merge, knowledge lookup, memory, MCP/API tools, human checkpoints, escalation, wait, retry, trigger and outcome. Components have explicit inputs/outputs, preconditions, success/failure, timeout/retry, risk/permissions and audit config. High-risk action without checkpoint blocks testing; external actions require Cognitive Core decision record.

Six engine pages: Cognitive Core, Motivation Engine, Knowledge Fabric, Swarm Orchestrator, Anthropomorphic Interface, Governance Sentinel. Testing covers golden cases, hard-rule coverage, adversarial/guardrail tests, checkpoint coverage and tool calls; illustrative 85% readiness threshold. Review queue shows diffs and pinned comments, approve/request changes, author cannot approve. Releases support staging, canary, production, illustrative 5% for 24 hours, health checks and rollback; all tools live before production. Clearly label sample data and simulated actions, do not imply real integrations or deployments. Studio Overview includes lifecycle counts, active bundle, recent changes, engine summaries, setup checklist and reviews assigned. Make nav, role switcher, theme toggle, tabs, filters, node editing, rule builder, drawers and buttons interactive. Desktop-first responsive design.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/09b881e7-7632-4846-9fcf-32564f6d2bf7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
