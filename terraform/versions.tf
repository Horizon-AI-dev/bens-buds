terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project      = var.project_id
  region       = var.region
  access_token = var.google_access_token
  credentials  = var.google_credentials_json
}
