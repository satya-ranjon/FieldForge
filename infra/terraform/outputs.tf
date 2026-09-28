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

