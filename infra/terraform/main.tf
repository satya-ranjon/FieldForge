terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "fieldforge-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

# AWS S3 Bucket for Work Order Deliverables (Before/After Photos, Checklists, Signatures)
resource "aws_s3_bucket" "deliverables" {
  bucket = "fieldforge-deliverables-storage-${var.environment}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deliverables_crypto" {
  bucket = aws_s3_bucket.deliverables.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "deliverables_versioning" {
  bucket = aws_s3_bucket.deliverables.id
  versioning_configuration {
    status = "Enabled"
  }
}
