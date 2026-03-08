# Terraform Baseline (Slice 6)

This stack provisions baseline infrastructure for Ben's Buds:

- Required GCP APIs.
- Vertex runtime IAM grant (`roles/aiplatform.user`) for the Cloud Run/runtime service account.
- Runtime service account for Cloud Run.
- Runtime service account key (JSON) stored in Secret Manager.
- Artifact Registry Docker repository.
- Secret Manager access binding for Discord token retrieval.

This stack does **not** deploy the Cloud Run application revision or image.
GitHub Actions handles build/push/deploy in Slice 7.

## Prerequisites

1. `Checkpoint C complete` is required before applying this stack.
2. Terraform CLI installed locally.
3. `gcloud auth application-default login` completed.
4. `gcloud config set project <PROJECT_ID>` completed.
5. Billing enabled on the project (required by Vertex AI API).

The required API set includes `aiplatform.googleapis.com` (Vertex AI).

If you do not want ADC locally, you can pass an access token instead:

```bash
export TF_VAR_google_access_token="$(gcloud auth print-access-token)"
```

Or pass service account JSON via variable:

```bash
export TF_VAR_google_credentials_json="$(cat /path/to/service-account.json)"
```

## Inputs

Fixed variables:

- `project_id` is pinned to `bens-buds`.

Common optional variables:

- `region` (default `us-central1`)
- `service_name` (default `bens-buds`)
- `artifact_registry_repository` (default `bens-buds`)
- `discord_token_secret_id` (default `discord-bot-token`)
- `discord_token_secret_version` (default `latest`)
- `enable_discord_secret_iam_binding` (default `false`)
- `service_account_json_secret_id` (default `gcp-service-account-json`)
- `service_account_json_secret_version` (default `latest`)

## Example tfvars

Create `terraform/terraform.tfvars` (ignored by `.gitignore`):

```hcl
region                      = "us-central1"
service_name                = "bens-buds"
artifact_registry_repository = "bens-buds"
discord_token_secret_id     = "discord-bot-token"
discord_token_secret_version = "latest"
enable_discord_secret_iam_binding = false
service_account_json_secret_id    = "gcp-service-account-json"
service_account_json_secret_version = "latest"
```

When Checkpoint C is complete and the secret exists, set:

```hcl
enable_discord_secret_iam_binding = true
```

## Manual apply runbook

From repo root:

```bash
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

## Post-apply checks

```bash
terraform output

gcloud secrets get-iam-policy discord-bot-token \
  --format='table(bindings.role,bindings.members)'
```

Use output values in your deploy workflow for:

- Cloud Run service name (`cloud_run_service_name`)
- Region (`deploy_region`)
- Runtime service account (`runtime_service_account_email`)
- Secret reference (`discord_token_secret_reference`)
- Service account JSON secret reference (`service_account_json_secret_reference`)

Application runtime usage:

- Set `GCP_SERVICE_ACCOUNT_JSON_SECRET` to `service_account_json_secret_reference` if you want app-level explicit credential loading from Secret Manager.

## Gate reminder

After a successful apply and validation, respond with:

`Terraform apply complete`

Slice 7 (GitHub Actions deploy workflow) stays blocked until that confirmation.
