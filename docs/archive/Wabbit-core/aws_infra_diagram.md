# AWS Cloud Infrastructure Diagram (Markdown)

## Mermaid (renderable)

```mermaid
flowchart TB

  %% =========================
  %% Top-level (AWS Cloud)
  %% =========================
  subgraph AWS["AWS Cloud"]
    direction TB

    R53["Route 53"]
    WAF["WAF"]
    COG["Cognito"]
    CW["CloudWatch"]

    %% =========================
    %% VPC
    %% =========================
    subgraph VPC["VPC (10.0.0.0/16)"]
      direction TB

      %% Public Subnets
      subgraph PUB["Public Subnets"]
        direction TB
        ALB["ALB<br/>(Internet)"]
        NAT["NAT Gateway"]
        ALB --> NAT
      end

      %% Private Subnets
      subgraph PRIV["Private Subnets"]
        direction TB
        ECS_API["ECS Service<br/>(API)"]
        ECS_NLP["ECS Service<br/>(NLP)"]
        VPCE["VPC Endpoints<br/>(ECR, S3, Secrets)"]

        ECS_API --- VPCE
        ECS_NLP --- VPCE
      end

      %% Database Subnets
      subgraph DB["Database Subnets"]
        direction LR
        RDS["RDS<br/>(PostgreSQL)"]
      end

      %% Traffic flows
      ALB -->|HTTPS| ECS_API
      NAT -->|NAT| ECS_NLP

      %% App to DB (conceptual)
      VPCE --> RDS
    end

    %% Outside VPC but inside AWS Cloud
    S3B["S3<br/>Bucket"]
    S3GW["S3 Gateway<br/>Endpoint"]
    S3B --> S3GW
    S3GW --> VPCE

    %% Top services integrations (conceptual)
    R53 --> ALB
    WAF --> VPC
    COG --> VPC
    CW --> VPC
  end
```

## ASCII (plain text)

```text
+----------------------------------------------------------------------------------+
|                                   AWS Cloud                                      |
|                                                                                  |
|    [Route 53]          [WAF]              [Cognito]                 [CloudWatch] |
|        |                |                   |                          |         |
|        |                v                   v                          v         |
|        |         +--------------------------------------------------------------+ |
|        |         |                      VPC (10.0.0.0/16)                       | |
|        |         |                                                              | |
|        |         |   +-------------------------+     +------------------------+ | |
|        |         |   |     Public Subnets      |     |     Private Subnets    | | |
|        |         |   |                         |     |                        | | |
|        +-------->|   |  +-------------------+  |HTTPS|  +-------------------+ | | |
|                  |   |  | ALB (Internet)    |---------------->| ECS Service (API)| | |
|                  |   |  +-------------------+  |     |  +-------------------+ | | |
|                  |   |           |             |     |                        | | |
|                  |   |           v             | NAT |  +-------------------+ | | |
|                  |   |    +--------------+     +----->|  ECS Service (NLP)  | | | |
|                  |   |    | NAT Gateway  |-----------/ +-------------------+ | | |
|                  |   |    +--------------+             |         |           | | |
|                  |   +-------------------------+       |         |           | | |
|                  |                                      |  +----------------+ | | |
|                  |                                      |  | VPC Endpoints  | | | |
|                  |                                      |  | (ECR,S3,Secrets)| | | |
|                  |                                      |  +----------------+ | | |
|                  |                                      |         |           | | |
|                  |         +------------------------------------------------+ | | |
|                  |         |                 Database Subnets               | | | |
|                  |         |                                                | | | |
|                  |         |               +------------------+             | | | |
|                  |         |               | RDS (PostgreSQL)  |<------------+ | | |
|                  |         |               +------------------+             | | | |
|                  |         +------------------------------------------------+ | | |
|                  +--------------------------------------------------------------+ |
|                                                                                  |
|   [S3 Bucket] ---> [S3 Gateway Endpoint] ---> (to VPC Endpoints)                  |
+----------------------------------------------------------------------------------+
```
