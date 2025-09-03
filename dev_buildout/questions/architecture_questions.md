# Architecture Questions

**Model:** o3  
**Date:** 07.15.25

## 1. Data Model & Architecture
• What are the core entities, their cardinalities, and expected read/write ratios?
• Which database engines (row, column, document, graph, vector) best match those access patterns—and why?
• How will we model AI-generated assets (text, images, embeddings) so that they're versioned and searchable without bloating hot tables?
• Do we need multi-tenant isolation (schema-per-tenant, row-level, or cluster-level)?
• Where will "truth" live if we split operational and analytical stores? How will we reconcile them?

## 2. Scalability & Performance
• What is our horizontal-scaling story (partitioning, sharding, or service slicing)? At what traffic threshold do we enact it?
• Which requests must remain strongly consistent, and where can we accept eventual consistency or async writes?
• How will we handle spikes from bulk AI-content ingestions (e.g., new GPT batch) without throttling interactive users?
• What's the cache hierarchy (client-side, CDN, read replicas, in-memory store) and its invalidation strategy?
• What are our preliminary SLOs (p99 latency, error rate) and how will we prove we can meet them?

## 3. Storage Economics & Retention
• Projected storage growth over 12–24 months? What tiering/compression life-cycle plan keeps costs sane?
• How do we garbage-collect or archive stale AI assets while preserving auditability?
• What backup, point-in-time-recovery, and cross-region fail-over windows do we require? What do they cost?

## 4. Security, Privacy & Compliance
• Which data classes (PII, customer secrets, AI training data) require encryption at rest and in transit?
• Do we need tenant-level encryption keys (KMS per org) for SOC 2 or HIPAA scopes?
• What is the audit-trail scheme for content edits, deletes, and external exports?
• How will we handle GDPR/CCPA "right to be forgotten" across primary DB, blob store, and search index?

## 5. AI-Specific Retrieval & Serving
• Will we embed text/images on ingest or on demand? Where do those vectors live (pgvector, Pinecone, Elastic k-NN, etc.)?
• How will we de-duplicate near-identical generated content at scale?
• Do we need a separate feature store for real-time ML inference, or can we read from the OLTP path?
• What guardrails limit hallucinated or policy-violating content before it hits the DB/UI?

## 6. Integrations & Extensibility
• What contract (GraphQL, REST+OpenAPI, gRPC, event bus) exposes our data so Slack, Teams, Canva, etc., can consume it?
• How do we keep third-party rate limits and OAuth scopes from DOS-ing our core service?
• Can partners subscribe to webhooks/streams instead of polling? If so, through what infra (Kafka, SNS, Realtime DB)?
• What is our versioning and deprecation policy for external APIs and slash-commands?

## 7. Observability & Operations
• Which metrics, traces, and log events must ship to monitoring from day 1 to catch slow queries and memory leaks?
• What auto-scaling signals (CPU, queue depth, custom business KPIs) trigger new pods/nodes?
• How will we run load tests that mimic mixed traffic (UI clicks + AI batch jobs + integration webhooks)?
• What's our plan for "one-click" local dev: seed data, fake S3/GCS, and replayable API mocks?

## 8. UI/UX at Scale
• How will the frontend stream large result sets (pagination, infinite scroll, virtual lists) without UI jank?
• What state-management pattern keeps multi-window editing and real-time updates in sync (e.g., CRDTs, Liveblocks)?
• Do we need granular role-based UI components, feature flags, or AB tests baked in from the start?
• How does the UI surface errors or rate-limit notices coming from third-party integrations gracefully?