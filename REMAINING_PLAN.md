# Remaining Plan (From Current State)

Current implementation status:
- Completed: Slice 1 (mention-only bot), Slice 2 (prompt-file driven deterministic responses), Slice 3 code plumbing (Secret Manager support + non-secret env var contract).
- Pending: manual completion of Checkpoint C, then Slices 4-8.

## Immediate Human Gate: Checkpoint C (Required)

Do these steps and confirm completion before continuing:

1. Create the Discord token secret in GCP Secret Manager.
2. Grant runtime identity `roles/secretmanager.secretAccessor` for that secret.
3. Set runtime secret reference format:
   - `DISCORD_BOT_TOKEN_SECRET=projects/<PROJECT_ID>/secrets/discord-bot-token/versions/latest`

Hard stop:
- Do not proceed to cloud deployment slices until Checkpoint C is confirmed complete.

## Slice 4 (Pending): Vertex AI Integration (Gemini 3 Flash)

Goal:
- Replace deterministic response generation with Vertex AI output while preserving mention-only gate and prompt loading.

Tasks:
1. Implement Vertex client wrapper in `src/ai/vertexClient.ts`.
2. Use env vars for non-secret config:
   - `GCP_PROJECT_ID`, `GCP_LOCATION`, `GEMINI_MODEL`
3. Add timeout/retry/fallback behavior.
4. Update message flow to call Gemini 3 Flash using loaded system prompt.

Working outcome:
- Mention -> prompt assembly -> Gemini response works end-to-end.

## Slice 5 (Pending): Container + Secure Cloud Run Runtime Surface

Goal:
- Package bot for Cloud Run with minimal HTTP exposure.

Tasks:
1. Add `Dockerfile` (multi-stage, non-root).
2. Add health-only HTTP endpoint for runtime checks.
3. Keep bot functionality off HTTP routes (Discord gateway only).
4. Document runtime settings and guidance (`PORT`, graceful shutdown, `min_instances=1`).

Working outcome:
- Container runs bot and exposes only health behavior over HTTP.

## Slice 6 (Pending): Terraform Baseline Infra (Manual Apply)

Goal:
- Provision secure, reproducible GCP infrastructure.

Tasks:
1. Create Terraform config under `terraform/` for:
   - API enablement
   - IAM/service accounts
   - Artifact Registry
   - Cloud Run service
   - Secret Manager access binding
   - ingress/auth controls
2. Configure Cloud Run with:
   - non-secret env vars
   - secret references for runtime token retrieval
3. Provide manual `terraform init/plan/apply` runbook.

Human gate:
1. User runs and approves Terraform apply.
2. User confirms resources are created successfully.

Hard stop:
- Do not continue to Slice 7 until Terraform apply is confirmed complete.

Working outcome:
- Infra is provisioned and bot can be deployed manually.

## Slice 7 (Pending): GitHub Actions Deploy on Push to Main

Goal:
- Automate app deployment only.

Tasks:
1. Add `.github/workflows/deploy.yml`.
2. Use GitHub OIDC/WIF to authenticate to GCP.
3. Build image, push to Artifact Registry, deploy Cloud Run revision.
4. Add fail-fast checks for required vars/secrets.
5. Keep Terraform out of CI (no apply).

Working outcome:
- Push to `main` deploys app revision to pre-provisioned infrastructure.

## Slice 8 (Pending): Hygiene + Final Runbook

Goal:
- Finalize repo hygiene and operations docs.

Tasks:
1. Expand `.gitignore` for:
   - Next.js
   - Terraform state/locks
   - gcloud local files
   - Docker/temp artifacts
   - Node/TypeScript outputs
   - local secret files
2. Finalize `README.md` with:
   - explicit human checkpoints
   - pause/resume flow
   - Discord setup steps
   - GCP setup steps
   - Secret Manager lifecycle and rotation guidance

Working outcome:
- Repo is production-oriented with explicit secure operational guidance.

## Resume Protocol

When resuming execution, provide one of these confirmations:
1. `Checkpoint C complete` to continue with Slice 4.
2. `Terraform apply complete` to continue with Slice 7.
