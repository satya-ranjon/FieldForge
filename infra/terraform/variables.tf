variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target deployment environment (dev, staging, prod)"
  default     = "staging"
}

variable "github_repository" {
  type        = string
  description = "GitHub repository in owner/repo format authorized to assume the ECR publisher role"
  default     = "satya-ranjon/FieldForge"

  validation {
    condition     = can(regex("^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$", var.github_repository))
    error_message = "The github_repository variable must be in the format 'owner/repo'."
  }
}

variable "manage_github_oidc_provider" {
  type        = bool
  description = "Whether Terraform should create and manage the GitHub OIDC provider in AWS IAM. Set to false if an account-wide provider already exists."
  default     = true
}

variable "existing_github_oidc_provider_arn" {
  type        = string
  description = "ARN of an existing account-wide GitHub OIDC provider if manage_github_oidc_provider is false"
  default     = null

  validation {
    condition     = var.existing_github_oidc_provider_arn == null || can(regex("^arn:aws[a-zA-Z-]*:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$", var.existing_github_oidc_provider_arn))
    error_message = "The existing_github_oidc_provider_arn must be a valid IAM OIDC provider ARN for token.actions.githubusercontent.com (e.g. arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com)."
  }
}
