# AWS IAM GitHub Actions OIDC Provider & Least-Privilege ECR Publisher Role
#
# PURPOSE
# -------
# Establishes federated authentication between GitHub Actions and AWS via OpenID
# Connect (OIDC), enabling short-lived, credential-less authentication for container
# image publishing. Defines a dedicated, least-privilege IAM role permitted to push
# images exclusively to the 7 FieldForge application ECR repositories from verified
# branches and release tags.
#
# SECURITY INVARIANTS
# -------------------
# 1. No long-lived AWS IAM credentials or secret access keys in GitHub Secrets.
# 2. Strict OIDC subject restrictions: only refs/heads/develop and refs/tags/v*
#    from the authoritative FieldForge repository (satya-ranjon/FieldForge).
# 3. Least-privilege ECR permissions: ecr:GetAuthorizationToken on "*" (API requirement),
#    push actions strictly scoped to the 7 FieldForge application ECR repository ARNs.
# 4. Zero access to S3, EKS, Secrets Manager, RDS, or IAM mutations.

locals {
  effective_github_oidc_provider_arn = var.manage_github_oidc_provider ? (
    length(aws_iam_openid_connect_provider.github) > 0 ? aws_iam_openid_connect_provider.github[0].arn : ""
    ) : (
    var.existing_github_oidc_provider_arn != null ? var.existing_github_oidc_provider_arn : ""
  )
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.manage_github_oidc_provider ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  tags = {
    Project     = "FieldForge"
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

data "aws_iam_policy_document" "github_actions_ecr_publisher_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.effective_github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repository}:ref:refs/heads/develop",
        "repo:${var.github_repository}:ref:refs/tags/v*"
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_ecr_publisher" {
  name                 = "fieldforge-github-ecr-publisher"
  description          = "Least-privilege IAM role assumed by GitHub Actions to publish container images to FieldForge ECR repositories"
  assume_role_policy   = data.aws_iam_policy_document.github_actions_ecr_publisher_assume_role.json
  max_session_duration = 3600

  tags = {
    Project     = "FieldForge"
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

data "aws_iam_policy_document" "github_actions_ecr_publisher" {
  statement {
    sid       = "ECRAuthToken"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "ECRRepositoryPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
    resources = [
      for repo in aws_ecr_repository.application :
      repo.arn
    ]
  }
}

resource "aws_iam_policy" "github_actions_ecr_publisher" {
  name        = "fieldforge-github-ecr-publisher-policy"
  description = "Allows GitHub Actions to authenticate and push container images to FieldForge ECR repositories"
  policy      = data.aws_iam_policy_document.github_actions_ecr_publisher.json

  tags = {
    Project     = "FieldForge"
    ManagedBy   = "Terraform"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "github_actions_ecr_publisher" {
  role       = aws_iam_role.github_actions_ecr_publisher.name
  policy_arn = aws_iam_policy.github_actions_ecr_publisher.arn
}
