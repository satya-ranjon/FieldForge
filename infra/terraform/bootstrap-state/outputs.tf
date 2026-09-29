output "state_bucket_name" {
  description = "Name of the provisioned S3 bucket for Terraform remote state"
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_region" {
  description = "AWS region of the remote state S3 bucket"
  value       = var.aws_region
}

output "state_bucket_arn" {
  description = "ARN of the provisioned remote state S3 bucket"
  value       = aws_s3_bucket.state.arn
}
