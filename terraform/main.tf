locals {
  required_services = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com"
  ])

  discord_token_secret_version_ref = "projects/${var.project_id}/secrets/${var.discord_token_secret_id}/versions/${var.discord_token_secret_version}"
}

resource "google_project_service" "required" {
  for_each = local.required_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_service_account" "runtime" {
  account_id   = var.runtime_service_account_name
  display_name = "Ben's Buds Cloud Run Runtime"

  depends_on = [google_project_service.required]
}

resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = var.artifact_registry_repository
  format        = "DOCKER"
  description   = "Container repository for Ben's Buds"

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_iam_member" "discord_token_accessor" {
  count = var.enable_discord_secret_iam_binding ? 1 : 0

  project   = var.project_id
  secret_id = var.discord_token_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.runtime.email}"

  depends_on = [google_project_service.required]
}
