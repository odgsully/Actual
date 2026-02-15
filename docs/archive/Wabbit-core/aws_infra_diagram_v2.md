# AWS Cloud Infrastructure Diagram (Markdown)

## Mermaid (renderable)

```mermaid
flowchart TB
  %% =========================
  %% AWS Cloud (outer)
  %% =========================
  subgraph AWS["AWS Cloud"]
    direction TB

    R53["Route 53<br/>DNS"]
    WAF["WAF<br/>L7 filtering"]
    COG["Cognito<br/>Auth (OIDC/JWT)"]
    CW["CloudWatch<br/>Logs/Metrics/Alarms"]

    %% =========================
    %% VPC
    %% =========================
    subgraph VPC["VPC (10.0.0.0/16)"]
      direction TB

      %% Public
      subgraph PUB["Public Subnets"]
        direction TB
        ALB["ALB<br/>(Internet-facing)"]
        NAT["NAT Gateway"]
        ALB --> NAT
      end

      %% Private
      subgraph PRIV["Private Subnets"]
        direction TB
        ECS_API["ECS Service<br/>(API)"]
        ECS_NLP["ECS Service<br/>(NLP)"]
        VPCE["VPC Endpoints<br/>(ECR, S3, Secrets)"]

        ECS_API --> ECS_NLP
        ECS_API --- VPCE
        ECS_NLP --- VPCE
      end

      %% Database
      subgraph DB["Database Subnets"]
        direction LR
        RDS["RDS<br/>(PostgreSQL)"]
      end

      %% Intra-VPC flows
      ALB -->|HTTPS| ECS_API
      NAT -->|egress for private tasks| ECS_API

      ECS_API -->|SQL| RDS
      ECS_NLP -->|SQL (optional)| RDS
    end

    %% S3 & gateway endpoint (conceptual)
    S3B["S3 Bucket"]
    S3GW["S3 Gateway Endpoint<br/>(inside VPC)"]
    S3B <--> S3GW
    S3GW --> VPCE

    %% Edge / platform integrations (conceptual)
    R53 --> WAF --> ALB
    COG --> ECS_API
    CW --> ECS_API
    CW --> ECS_NLP
    CW --> RDS
  end
```

## ASCII (plain text)

```text
+----------------------------------------------------------------------------------+
|                                   AWS Cloud                                      |
|                                                                                  |
|   [Route 53 DNS] ---> [WAF] ---> [ALB (Internet-facing)]                          |
|                           \                                                     |
|                            \ (auth context)                                      |
|                             ---> [Cognito]                                        |
|                                                                                  |
|   +--------------------------------------------------------------------------+   |
|   |                          VPC (10.0.0.0/16)                               |   |
|   |                                                                          |   |
|   |   +---------------------------+         +-----------------------------+  |   |
|   |   |       Public Subnets      |         |       Private Subnets       |  |   |
|   |   |                           |  HTTPS  |                             |  |   |
|   |   |  +---------------------+  | ------> |  +-----------------------+  |  |   |
|   |   |  | ALB (Internet)      |  |         |  | ECS Service (API)     |--+--+---> to DB
|   |   |  +---------------------+  |         |  +-----------------------+  |  |   |
|   |   |            |             |         |            |               |  |   |
|   |   |            v             |         |            v               |  |   |
|   |   |      +-----------+       |         |  +-----------------------+ |  |   |
|   |   |      | NAT GW    |-------+  egress  |  | ECS Service (NLP)     | |  |   |
|   |   |      +-----------+                 |  +-----------------------+ |  |   |
|   |   +---------------------------+        |            |               |  |   |
|   |                                        |            |               |  |   |
|   |                                        |  +-----------------------+ |  |   |
|   |                                        |  | VPC Endpoints         | |  |   |
|   |                                        |  | (ECR, S3, Secrets)    | |  |   |
|   |                                        |  +-----------------------+ |  |   |
|   |                                        +-----------------------------+  |   |
|   |                                                                          |   |
|   |   +------------------------------ Database Subnets -------------------+   |   |
|   |   |                                                                    |   |   |
|   |   |                     +-------------------------+                    |   |   |
|   |   |                     | RDS (PostgreSQL)        |                    |   |   |
|   |   |                     +-------------------------+                    |   |   |
|   |   +--------------------------------------------------------------------+   |   |
|   +--------------------------------------------------------------------------+   |
|                                                                                  |
|   [S3 Bucket] <--> [S3 Gateway Endpoint] ---> (VPC Endpoints)                     |
|                                                                                  |
|   CloudWatch: logs/metrics/alarms for ECS services + RDS                           |
+----------------------------------------------------------------------------------+
```

---

## Natural-language description

### What the boxes represent

- **AWS Cloud**: The overall boundary of deployed AWS services.
- **Route 53 (DNS)**: Resolves your domain to the internet-facing entry point.
- **WAF**: Applies Layer-7 (HTTP/HTTPS) rules (allow/deny, rate limiting, bot control, etc.) before requests reach the load balancer.
- **ALB (Internet-facing)** *(Public Subnets)*: Receives inbound HTTPS traffic from the internet and routes it to targets in private subnets.
- **NAT Gateway** *(Public Subnets)*: Provides outbound internet access for workloads in private subnets (for updates, third-party APIs, package downloads, etc.).
- **Private Subnets**: Where your compute runs without direct inbound internet exposure.
  - **ECS Service (API)**: Primary application/API backend. Receives traffic from the ALB.
  - **ECS Service (NLP)**: Internal service for NLP/ML/processing (invoked by the API service).
  - **VPC Endpoints**: Private connectivity from the VPC to AWS services (commonly **ECR**, **S3**, **Secrets Manager**), avoiding public internet paths.
- **Database Subnets**: Isolated subnets for stateful data services.
  - **RDS (PostgreSQL)**: Primary relational database.
- **S3 Bucket + S3 Gateway Endpoint**: Object storage accessed privately from within the VPC via the gateway endpoint.
- **CloudWatch**: Observability (logs, metrics, alarms) for ECS services and RDS.

### Hierarchy (containment)

1. **AWS Cloud**
   - Edge/control-plane services: Route 53, WAF, Cognito, CloudWatch
   - **VPC (10.0.0.0/16)**
     - Public Subnets (ALB, NAT)
     - Private Subnets (ECS services, VPC endpoints)
     - Database Subnets (RDS)

### Order of operations (typical request path)

1. **Client lookup**: A user hits `app.example.com` → **Route 53** returns the ALB/WAF fronted endpoint.
2. **Request filtering**: **WAF** evaluates the request (rules, rate limits, IP reputation, etc.).
3. **Ingress**: Allowed traffic reaches the **ALB** in public subnets over **HTTPS**.
4. **Routing**: The **ALB** forwards the request to **ECS Service (API)** in private subnets.
5. **Authentication/authorization**:
   - The API uses **Cognito** (JWT validation / OIDC integration / user pools) to validate identity and permissions.
6. **Internal processing**:
   - The API calls **ECS Service (NLP)** for specialized processing when needed.
7. **Data access**:
   - API/NLP read/write to **RDS (PostgreSQL)** in database subnets.
8. **AWS service access (private)**:
   - ECS tasks access **S3 / ECR / Secrets** through **VPC Endpoints** (and S3 via the **S3 Gateway Endpoint**) to keep traffic off the public internet.
9. **Outbound internet (only if needed)**:
   - Private workloads that must call external services egress through the **NAT Gateway**.
10. **Observability**:
   - Services and database emit logs/metrics to **CloudWatch**, which triggers alarms/dashboards.

### Notes (interpretation of the source diagram)

- The original diagram is an architectural overview (not every AWS “best practice” component is shown, e.g., multi-AZ duplication, security groups/NACLs, IAM roles, etc.).
- The “VPC Endpoints” box is a conceptual grouping; in practice, you typically configure specific endpoints per service (Interface/Gateway endpoints).
