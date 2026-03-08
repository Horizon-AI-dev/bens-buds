# Ben's Buds

Discord bot for helping Ben choose an alt character.

## Slice status

This repo currently implements Slice 2:
- Bun + TypeScript Discord bot.
- Bot only responds to `@mentions`.
- Deterministic prompt-driven response (no Vertex integration yet).
- System prompt is editable at `prompts/system/alt-character-coach.txt`.

This repo now also includes Slice 3 runtime config plumbing:
- Secret Manager token retrieval at runtime via `DISCORD_BOT_TOKEN_SECRET`.
- Local development fallback via `DISCORD_BOT_TOKEN`.
- Non-secret parameters read from environment variables.

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
   - Secret Manager is ready for runtime secrets.
   - You can grant IAM roles for Cloud Run runtime identity.
3. Checkpoint C (required before moving to cloud slices):
   - Secret `discord-bot-token` created in GCP Secret Manager.
   - Runtime identity has `roles/secretmanager.secretAccessor`.
   - You can provide `DISCORD_BOT_TOKEN_SECRET` as a full secret version path.

Do not continue to cloud deployment slices until you explicitly confirm each checkpoint is complete.

## Secret and config policy

- Secrets: store in GCP Secret Manager and resolve at runtime.
   - Current required secret: Discord bot token.
- Non-secrets: configure as environment variables on the container/service.
   - `GCP_PROJECT_ID`, `GCP_LOCATION`, `GEMINI_MODEL`, `DISCORD_APPLICATION_ID`, `PROMPT_FILE_PATH`, `LOG_LEVEL`, `PORT`.

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

## Validation

- Mention the bot in a channel: it should reply.
- Send a non-mention message: it should not reply.
