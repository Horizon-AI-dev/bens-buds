locals {
  required_services = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com"
  ])

  discord_token_secret_version_ref        = "projects/${var.project_id}/secrets/${var.discord_token_secret_id}/versions/${var.discord_token_secret_version}"
  service_account_json_secret_version_ref = "projects/${var.project_id}/secrets/${var.service_account_json_secret_id}/versions/${var.service_account_json_secret_version}"
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

resource "google_service_account_key" "runtime_json" {
  service_account_id = google_service_account.runtime.name
  key_algorithm      = "KEY_ALG_RSA_2048"
  private_key_type   = "TYPE_GOOGLE_CREDENTIALS_FILE"
}

resource "google_secret_manager_secret" "service_account_json" {
  project   = var.project_id
  secret_id = var.service_account_json_secret_id

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "service_account_json" {
  secret      = google_secret_manager_secret.service_account_json.id
  secret_data = base64decode(google_service_account_key.runtime_json.private_key)
}

resource "google_secret_manager_secret_iam_member" "service_account_json_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.service_account_json.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.runtime.email}"
}
