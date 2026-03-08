variable "project_id" {
  description = "GCP project ID hosting Ben's Buds."
  type        = string
  default     = "bens-buds"

  validation {
    condition     = var.project_id == "bens-buds"
    error_message = "project_id is fixed and must be bens-buds."
  }
}

variable "region" {
  description = "Primary region for Cloud Run and Artifact Registry."
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
  default     = "bens-buds"
}

variable "runtime_service_account_name" {
  description = "Service account account_id for Cloud Run runtime."
  type        = string
  default     = "bens-buds-runtime"
}

variable "artifact_registry_repository" {
  description = "Artifact Registry Docker repository name."
  type        = string
  default     = "bens-buds"
}

variable "discord_token_secret_id" {
  description = "Secret Manager secret ID for Discord bot token (no project prefix)."
  type        = string
  default     = "discord-bot-token"
}

variable "discord_token_secret_version" {
  description = "Secret version used by runtime reference."
  type        = string
  default     = "latest"
}

variable "enable_discord_secret_iam_binding" {
  description = "Set true only after discord-bot-token secret exists in project bens-buds."
  type        = bool
  default     = false
}

variable "service_account_json_secret_id" {
  description = "Secret Manager secret ID that stores runtime service account JSON credentials."
  type        = string
  default     = "gcp-service-account-json"
}

variable "service_account_json_secret_version" {
  description = "Secret version label used in references for runtime service account JSON secret."
  type        = string
  default     = "latest"
}

variable "google_access_token" {
  description = "Optional OAuth2 access token for Google provider auth (useful when ADC is not configured)."
  type        = string
  default     = null
  sensitive   = true
}

variable "google_credentials_json" {
  description = "Optional service account JSON credentials content for Google provider auth."
  type        = string
  default     = null
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub owner/org for the repository where Actions secrets and variables are managed."
  type        = string
  default     = "Horizon-AI-dev"
}

variable "github_repository" {
  description = "GitHub repository name where Actions secrets and variables are managed."
  type        = string
  default     = "bens-buds"
}

variable "github_token" {
  description = "GitHub token with repo administration permissions for managing Actions secrets and variables."
  type        = string
  default     = null
  sensitive   = true
}

variable "discord_bot_token_plaintext" {
  description = "Optional plaintext Discord bot token to sync into GitHub Actions secret DISCORD_BOT_TOKEN."
  type        = string
  default     = null
  sensitive   = true
}
