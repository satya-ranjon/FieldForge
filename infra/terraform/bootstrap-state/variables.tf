variable "aws_region" {
  type        = string
  description = "AWS deployment region for the remote state S3 bucket"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Target deployment environment (staging, prod)"
  default     = "staging"
}
