# Job-Tooling Guides - Plan

The layer job postings actually name: the **specific tools** a new hire is expected to
already know - the way the frameworks tier names Django/Spring instead of just "web framework."
These deepen existing **concept** guides (e.g. `databases/database-migrations`) with named,
hands-on tool guides in the standard battle-hardened-friend voice + verified gate.

**Demand markers:** ⭐⭐ = near-universal on JDs · ⭐ = very common · (none) = strong-to-have.

**Placement (decide per batch):** lean toward slotting each guide into the **existing category**
of the concept it deepens (migrations → `databases`, Kafka → `apis`, Pytest → `testing`, …) so it
surfaces next to that concept. Alternative: a dedicated **"Developer Tools / Tooling"** category.
Per CLAUDE.md, the category subfolder must equal a slug in `platform/core/src/categories.rs` DEFS -
if a new category is chosen, add it there first.

**Build process (per guide):** same as frameworks tier - write `_guide.md` myself, dispatch
per-phase subagents with full conventions + accurate facts, then run the review gate (LF normalize,
banned-words grep, Python validator: frontmatter `---\n`, links resolve, quiz JSON strict/3-Q,
mermaid ≤12, cross-guide slugs exist) + `cargo test -p content-core --test real_guides`.

---

> **BUILT 2026-06-30 - the whole list shipped.** All ~54 tools landed in a dedicated new **`tooling`** category ("Tools & Workflow"), sub-grouped by the A–M themes via the `group:` frontmatter field. Gate-clean (structural 224/224, banned clean, content-core green) and correctness spot-checked (Flyway, Maven, Kafka, Redis, JWT, OAuth2, Pytest). The checkboxes below are left unticked as the original wishlist; the category is the source of truth now.

## A. Database migrations & schema tooling - *deepens `databases/database-migrations`*
- [ ] Flyway ⭐⭐ (JVM default)
- [ ] Liquibase ⭐
- [ ] Alembic ⭐ (Python / SQLAlchemy)
- [ ] Prisma Migrate (Node)
- [ ] golang-migrate / Atlas
- [ ] dbmate / Sqitch

## B. Build tools & package/dependency managers - *biggest gap; on nearly every JD*
- [ ] Maven ⭐⭐
- [ ] Gradle ⭐⭐ (Java / Kotlin / Android)
- [ ] npm / pnpm / yarn ⭐⭐
- [ ] pip + venv / Poetry / uv ⭐⭐ (Python)
- [ ] Make / Makefiles ⭐
- [ ] Bazel

## C. Messaging, streaming & caching - *deepens `apis/webhooks-and-message-queues`, `architecture/caching`*
- [ ] Kafka ⭐⭐
- [ ] Redis ⭐⭐ (cache, queues, locks)
- [ ] RabbitMQ ⭐
- [ ] NATS / SQS

## D. CI/CD platforms - *deepens `devops/your-first-pipeline-github-actions`*
- [ ] GitLab CI/CD ⭐
- [ ] Jenkins ⭐ (enterprise everywhere)
- [ ] Argo CD / GitOps
- [ ] CircleCI

## E. Containers & orchestration - *deepens `infrastructure/kubernetes-*`, `docker-*`*
- [ ] Helm ⭐
- [ ] kubectl day-to-day ⭐
- [ ] Podman

## F. Config management & IaC - *deepens `devops/infrastructure-as-code-terraform`*
- [ ] Ansible ⭐⭐
- [ ] Pulumi
- [ ] AWS CloudFormation

## G. Cloud provider fundamentals - *deepens `infrastructure/cloud-platforms-explained`*
- [ ] AWS core ⭐⭐ (S3 / EC2 / RDS / IAM / Lambda)
- [ ] Azure fundamentals
- [ ] GCP fundamentals

## H. Observability & error tracking - *deepens `performance/observability-*`*
- [ ] OpenTelemetry ⭐
- [ ] Sentry ⭐
- [ ] ELK / Elasticsearch stack ⭐
- [ ] Datadog
- [ ] Grafana Loki

## I. Testing tools - *deepens the whole `testing/` category*
- [ ] Pytest ⭐⭐
- [ ] JUnit + Mockito ⭐⭐
- [ ] Jest / Vitest ⭐⭐
- [ ] Playwright ⭐
- [ ] Cypress / Selenium
- [ ] Testcontainers ⭐
- [ ] k6 / JMeter (load)

## J. Code quality, linting & hooks
- [ ] ESLint + Prettier ⭐⭐
- [ ] Ruff / Black ⭐ (Python)
- [ ] SonarQube ⭐ (enterprise)
- [ ] pre-commit

## K. Auth & identity - *deepens `security/auth-vs-authz`*
- [ ] OAuth2 / OpenID Connect ⭐⭐
- [ ] JWT in depth ⭐⭐
- [ ] Keycloak / Auth0

## L. API contracts & search
- [ ] OpenAPI / Swagger ⭐⭐
- [ ] Elasticsearch / OpenSearch ⭐
- [ ] GraphQL clients (Apollo)

## M. Secrets & supply chain
- [ ] HashiCorp Vault ⭐
- [ ] Docker Hub / Nexus / Artifactory
- [ ] Protobuf / Avro (serialization)

---

## Suggested first batch (highest-leverage, language-spanning)
Flyway + Liquibase (A) · Maven + Gradle (B) · Kafka + Redis (C) · Pytest + JUnit + Jest (I) ·
OAuth2/OIDC + JWT (K) · AWS core (G). Highest JD frequency; pairs with guides already shipped.

**Status:** menu approved 2026-06-24 - implement batch by batch. Nothing built yet.
