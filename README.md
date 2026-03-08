# Ben's Buds

Discord bot for helping Ben choose an alt character.

## Slice status

Completed:
- Bun + TypeScript Discord bot.
- Bot only responds to `@mentions`.
- Vertex AI response generation via Gemini model on Vertex.
- System prompt is editable at `prompts/system/alt-character-coach.txt`.
- Runtime Secret Manager token retrieval via `DISCORD_BOT_TOKEN_SECRET`.
- Health-only HTTP endpoint at `/healthz` for Cloud Run checks.
- Multi-stage, non-root Docker runtime (`Dockerfile`).
- Terraform baseline stack under `terraform/` for API enablement, IAM, Artifact Registry, and secret-access bindings.

Pending:
- Manual completion of Checkpoint C confirmation.
- Manual Terraform apply confirmation.
- Slice 7 CI deploy workflow (blocked until Terraform apply is confirmed).
- Final docs polish pass.

## Prerequisites (human steps)

1. Create a Discord application and bot in the Discord Developer Portal.
2. Enable privileged message content intent for the bot.
3. Invite the bot to your server with permissions to read/send messages.
4. Put your token in local environment (`DISCORD_BOT_TOKEN`) for local testing.
5. Install Bun on your machine before running any commands.

## Checkpoints (stop and confirm)

1. Checkpoint A (required before runtime testing):
   - Discord app is created.
   - Bot user is created and invited to your server.
   - Message content intent is enabled.
   - You have a bot token available.
2. Checkpoint B (required before cloud deployment slices):
   - GCP project and billing are set up.
   - Vertex AI API (`aiplatform.googleapis.com`) is enabled for the project.
   - Secret Manager is ready for runtime secrets.
   - You can grant IAM roles for Cloud Run runtime identity.
3. Checkpoint C (required before moving to cloud slices):
   - Secret `discord-bot-token` created in GCP Secret Manager.
   - Runtime identity has `roles/secretmanager.secretAccessor`.
   - You can provide `DISCORD_BOT_TOKEN_SECRET` as a full secret version path.
4. Terraform apply checkpoint (required before CI deploy automation):
   - `terraform init/plan/apply` has been run successfully from `terraform/`.
   - Cloud Run service, Artifact Registry repo, and IAM bindings were verified.
   - You confirm completion with: `Terraform apply complete`.

Do not continue to cloud deployment slices until you explicitly confirm each checkpoint is complete.

## Secret and config policy

- Secrets: store in GCP Secret Manager and resolve at runtime.
   - Current required secret: Discord bot token.
   - Optional runtime secret: service account JSON (`GCP_SERVICE_ACCOUNT_JSON_SECRET`).
- Non-secrets: configure as environment variables on the container/service.
   - `GCP_PROJECT_ID`, `GCP_LOCATION`, `GEMINI_MODEL`, `DISCORD_APPLICATION_ID`, `PROMPT_FILE_PATH`, `LOG_LEVEL`, `PORT`.
   - Optional local override: `GCP_SERVICE_ACCOUNT_JSON`.

## Local development with Bun

1. Install dependencies:
   ```bash
   bun install
   ```
2. Create environment file:
   - PowerShell:
     ```powershell
     Copy-Item .env.example .env
     ```
   - Bash:
     ```bash
     cp .env.example .env
     ```
3. Start bot:
   ```bash
   bun run dev
   ```

Local runtime note:
- If `DISCORD_BOT_TOKEN` is not set, startup expects `DISCORD_BOT_TOKEN_SECRET` and active GCP credentials.
- Vertex auth precedence is: `GCP_SERVICE_ACCOUNT_JSON` -> `GCP_SERVICE_ACCOUNT_JSON_SECRET` -> ADC.

## Prompt editing

- Edit `prompts/system/alt-character-coach.txt` to change bot guidance.
- Restart the bot after changing prompt text.

## Secret Manager setup (human step)

1. Create secret and set first value:
   ```powershell
   gcloud secrets create discord-bot-token --replication-policy=automatic
   $env:DISCORD_TOKEN_VALUE="<paste-token-here>"
   $env:DISCORD_TOKEN_VALUE | gcloud secrets versions add discord-bot-token --data-file=-
   ```
2. Use this runtime variable value:
   ```text
   DISCORD_BOT_TOKEN_SECRET=projects/<PROJECT_ID>/secrets/discord-bot-token/versions/latest
   ```
3. Grant runtime identity access:
   ```powershell
   gcloud secrets add-iam-policy-binding discord-bot-token `
     --member="serviceAccount:<RUNTIME_SA_EMAIL>" `
     --role="roles/secretmanager.secretAccessor"
   ```

## Container runtime (Slice 5)

Build image:

```bash
docker build -t bens-buds:local .
```

Run locally:

```bash
docker run --rm -p 8080:8080 \
   -e DISCORD_BOT_TOKEN="<token-for-local-only>" \
   -e GCP_PROJECT_ID="<project-id>" \
   -e GCP_LOCATION="us-central1" \
   -e GEMINI_MODEL="gemini-3.0-flash" \
   bens-buds:local
```

Health check:

```bash
curl http://localhost:8080/healthz
```

## Terraform baseline (Slice 6)

Terraform stack lives in `terraform/`.

Runbook:

```bash
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Detailed variable guidance and post-apply checks are in `terraform/README.md`.

Terraform intentionally does not deploy Cloud Run revisions. GHA handles image build/push and service deployment.

## Pause and resume protocol

- To continue from Checkpoint C gate: `Checkpoint C complete`
- To continue from Terraform apply gate: `Terraform apply complete`

## Validation

- Mention the bot in a channel: it should reply with Gemini output.
- Send a non-mention message: it should not reply.
- Hit `GET /healthz`: returns `200` with `{ "status": "ok" }`.
