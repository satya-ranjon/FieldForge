# AWS Elastic Container Registry (ECR) Repositories & Lifecycle Policies
#
# PURPOSE
# -------
# Defines declarative AWS ECR repositories for all 7 FieldForge application images
# with tag immutability, automated vulnerability scanning on push, KMS encryption at rest,
# and tiered image lifecycle retention rules.
#
# ENVIRONMENT SEPARATION
# ----------------------
# Repositories are environment-agnostic (single repository per application).
# Environments (staging vs production) are distinguished via immutable image tags
# (sha-<commit-sha> and v<semver>), enabling promotion of identical verified digests.

locals {
  application_ecr_repositories = toset([
    "fieldforge/api-gateway",
    "fieldforge/auth-service",
    "fieldforge/billing-service",
    "fieldforge/dispatch-matching-service",
    "fieldforge/notification-service",
    "fieldforge/work-order-service",
    "fieldforge/web-buyer-portal"
  ])
}

resource "aws_ecr_repository" "application" {
  for_each             = local.application_ecr_repositories
  name                 = each.value
  image_tag_mutability = "IMMUTABLE"
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
  }

  tags = {
    Project     = "FieldForge"
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

resource "aws_ecr_lifecycle_policy" "application" {
  for_each   = aws_ecr_repository.application
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Retain the most recent 30 semver release images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Retain the most recent 30 commit images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-"]
          countType     = "imageCountMoreThan"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Expire untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
