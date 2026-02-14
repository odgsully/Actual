# Wabbit

## A. What is it? Core features

- Quickfire polling users/teams for tasks where Human in the Loop needed for taste & direction
- Wabbit file system (left side bar)
- Clean generative ranking UI & database
- Custom permissions & weights on a project by project (Wabb by Wabb) basis amongst Team
- Polls users on: Text, prompts, images, videos, 3D assets/scenes, decks, demos, audio
- Rank generated media either solo or collaboratively with other team members to get a consensus where best generations get great RAVG and rise to the top.
- Customizable display/features (1-10 rank [decimals to the nearest tenth], 2-axis X Y, Binary Yes/No, Quaternary [4-option A/B/C/D multiple choice]) established on New Wabb setup or new Wabb Proposal. Quaternary labels are configurable per-Wabb; changing a Quaternary label triggers a Branched Wabb with user confirmation prompt.
- Agentic Improvement toggles (Phase 1: UI settings toggle only; agent logic wired up in later phases)
- Lightweight video player with node timeline (videos) — basic player with chapter markers for navigation
- Lightweight Photoshop layers (photos) — read-only layer visibility toggle for reviewing design comps
- Ideal for agentic layer HIL review touchpoints, product demos and design, engaging short form content, long form editing, internal documentation etc.
- View ranking history on Wabbs for yourself, and team members.
- Integrations for Notifications in users existing tech stack i.e. Slack, Teams, Telegram, WhatsApp, Gmail, etc...
- Social Media scheduler (Phase 3 / Wave 5)

## B. Where is it?

- Web app. Cloud database.
- Exists vicariously on mobile via Wabbit supported Integration's own apps.

## C. When is it?

- In terms of product, Wabb's (automated project record generation), triggers are customizable.
- In terms of the business aspect, If this is a flawed idea, we must fail as quick as possible.

## D. Terminology

- **Wabb** – an automated project record generation supporting Text, Images, Videos, 3D assets/scenes, Decks & Demos. To be sent for review from the Team.
- **Display Features** - Set of UI assets such as 1-10 rank [decimals to the nearest tenth], 2-axis X Y, Binary Yes/No, Quaternary (4-option A/B/C/D multiple choice with configurable labels per-Wabb), etc...
- **Wabb Time Window** – Life span of new records being generated. Every time one Wabb's Time Window closes, it can still be reopened, but just logged as "'Project Name' Window 2". Functions as a sprint. Closing a window locks that sprint's generation period. Rankings from previous windows remain visible and referenceable in subsequent windows.
- **Wabb Timeline** – View all users and the Owner on the project
- **Branched Wabb** – An offshoot of a Wabb as the project progresses past original outline (change Wabb's display/features, context or other). Rankings do NOT carry over — a Branch always starts with fresh rankings. A branching menu lets the user select what to bring over with smart defaults: Asset Library and Display Feature configuration are pre-checked; Team assignments, Context Docs/SOPs, Agent Optimization Level, and Notification Preferences are unchecked by default. Changing a Quaternary label value also triggers a Branch (with user confirmation prompt).
- **Wabb Path** – View the pipeline through to post/end result. Also viewable are all Documents references (assets, SOP, project goal, overview, etc...)
- **Wabb Proposal** – Request from a User to the Owner for a New or Branched Wabb
- **Asset Library** – a home of all loaded & saved assets
- **Rank History Gallery** – All records assigned to a User, both voted & unvoted for quantitative polls.
- **RAVG** – Ranking average of the level 1 project assignees for quantitative polls. Default formula: simple arithmetic mean. Customizable per-Wabb at creation or after the fact in Settings — choose from predefined formulas (weighted by role, exclude outliers, etc.) and/or assign granular per-member weight multipliers.
- **Super RAVG** – Ranking average of the level 1 project assignees WITH Owner (level 2) scoring applied on top. The Owner is excluded from the level 1 team RAVG; their score is applied separately with a configurable supervisor weight. ("Supervisor" = the level 2 weighting concept; mapped to the Owner role in the database.)
- **Agent Optimization Level** - No, Low, Medium, High.
  - **No**: will disable any Agent background decisions
  - **Low**: will always ask for Agent decisions to the Owner prior to implement
  - **Medium (recommended)**: will make obvious decisions without asking
  - **High**: will not prompt the Owner with changes geared for optimizing and staying up to date with the rapidly evolving new tools outperforming previously established ones.
- **Vetted ref** – Type of Wabb; Generate materials around a concept, trend or other. Given a proven end result (the "vet"), the Wabb is structured around replicating and recycling aspects of that reference — generating variations inspired by what already worked.
- **ALL EVER table** – Raw overall database of all client's records

## E. Forward Looking

- Primary is web application 
- Next is a mobile app with great haptic ranking 1-10 UI.
- Next is a Slack marketplace app
- Last is Integrations & delivery systems of using email &/or Slack/Teams/ClickUp/Asana.
