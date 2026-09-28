output "vpc_id" {
  description = "ID of VPC provisioned for FieldForge"
  value       = module.vpc.vpc_id
}

output "deliverables_bucket_name" {
  description = "Name of S3 bucket provisioned for FieldForge deliverables"
  value       = aws_s3_bucket.deliverables.bucket
}

output "ecr_repository_urls" {
  description = "Map of application ECR repository names to their repository URLs"
  value = {
    for name, repo in aws_ecr_repository.application :
    name => repo.repository_url
  }
}

output "ecr_repository_arns" {
  description = "Map of application ECR repository names to their ARNs"
  value = {
    for name, repo in aws_ecr_repository.application :
    name => repo.arn
  }
}

output "github_actions_ecr_publisher_role_arn" {
  description = "ARN of IAM role assumed by GitHub Actions to publish images to FieldForge ECR repositories"
  value       = aws_iam_role.github_actions_ecr_publisher.arn
}

output "github_oidc_provider_arn" {
  description = "Effective ARN of GitHub Actions OIDC provider used for federated IAM authentication"
  value       = local.effective_github_oidc_provider_arn
}

