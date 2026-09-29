# AWS S3 Remote State Storage Bootstrap
#
# PURPOSE
# -------
# Provisions the dedicated, standalone S3 bucket used as the remote backend
# for the main FieldForge Terraform infrastructure stack.
#
# ARCHITECTURAL INVARIANTS
# ------------------------
# 1. Independent root module: This bootstrap stack intentionally executes with
#    local state. It CANNOT use an S3 backend, avoiding a chicken-and-egg
#    circular dependency on the very bucket it creates.
# 2. Dedicated state storage: Stores exclusively Terraform state files. Never mixed
#    with application deliverables or public media.
# 3. Native S3 state locking: No DynamoDB table is created. State locking is
#    handled natively via S3 conditional writes (use_lockfile = true in the S3 backend).
# 4. Data recovery & protection: Bucket versioning is enabled, AES256 server-side
#    encryption is enforced, all public access is blocked, and lifecycle prevent_destroy
#    is set to prevent accidental deletion.
# 5. Deterministic bucket naming: Composed of account ID and region via data.aws_caller_identity.

terraform {
  required_version = ">= 1.12.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "state" {
  bucket = "fieldforge-terraform-state-${data.aws_caller_identity.current.account_id}-${var.aws_region}"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Project     = "FieldForge"
    ManagedBy   = "Terraform"
    Purpose     = "TerraformStateStorage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "state_versioning" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_crypto" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state_public_access_block" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
