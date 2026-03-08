output "runtime_service_account_email" {
  description = "Cloud Run runtime service account email."
  value       = google_service_account.runtime.email
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository resource details."
  value = {
    id       = google_artifact_registry_repository.app.id
    location = google_artifact_registry_repository.app.location
    name     = google_artifact_registry_repository.app.name
  }
}

output "cloud_run_service_name" {
  description = "Target Cloud Run service name that GHA should deploy to."
  value       = var.service_name
}

output "discord_token_secret_reference" {
  description = "Secret Manager version path GHA should set as DISCORD_BOT_TOKEN_SECRET."
  value       = local.discord_token_secret_version_ref
}

output "deploy_region" {
  description = "Region GHA should deploy Cloud Run service into."
  value       = var.region
}
