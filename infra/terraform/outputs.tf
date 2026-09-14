output "vpc_id" {
  description = "ID of VPC provisioned for FieldForge"
  value       = module.vpc.vpc_id
}

output "deliverables_bucket_name" {
  description = "Name of S3 bucket provisioned for FieldForge deliverables"
  value       = aws_s3_bucket.deliverables.bucket
}

