variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_profile" {
  type    = string
  default = "chiklati-bank"
}

variable "project_name" {
  type    = string
  default = "chiklati-bank"
}

variable "github_repo" {
  description = "GitHub repo in owner/name form, for the OIDC trust condition"
  type        = string
  default     = "kishore-dubey/chiklati-bank"
}

variable "public_domain" {
  description = "Public hostname for the app (e.g. a DuckDNS subdomain pointed at the Elastic IP). Let's Encrypt refuses to issue certs for *.amazonaws.com, so the EC2 instance's own public DNS name can't be used here -- confirmed via a real rejected ACME order."
  type        = string
}

variable "ec2_instance_type" {
  description = "Free tier: t2.micro or t3.micro depending on account/region eligibility -- check the Billing console's Free Tier page before applying"
  type        = string
  default     = "t3.micro"
}

variable "rds_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "elasticache_node_type" {
  type    = string
  default = "cache.t3.micro"
}

variable "db_name" {
  type    = string
  default = "chiklati_bank"
}

variable "db_username" {
  type    = string
  default = "chiklati"
}

variable "db_password" {
  description = "RDS master password -- set in terraform.tfvars (gitignored), never commit"
  type        = string
  sensitive   = true
}

variable "unit_api_base_url" {
  type    = string
  default = "https://api.s.unit.sh"
}

variable "unit_api_token" {
  description = "Unit sandbox org API token -- set in terraform.tfvars (gitignored)"
  type        = string
  sensitive   = true
}

variable "unit_webhook_secret" {
  description = "Unit webhook signing secret -- set in terraform.tfvars (gitignored)"
  type        = string
  sensitive   = true
}

variable "unit_default_deposit_product" {
  type    = string
  default = "checking"
}

variable "nextauth_secret" {
  description = "Auth.js session secret -- set in terraform.tfvars (gitignored)"
  type        = string
  sensitive   = true
}

variable "internal_api_secret" {
  description = "Shared web<->api service JWT secret -- set in terraform.tfvars (gitignored)"
  type        = string
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention -- explicit, since the default is unlimited and would silently exceed the free tier over months"
  type        = number
  default     = 14
}

variable "root_volume_size_gb" {
  description = "EC2 root volume size. 30GB is the real floor: the ECS-optimized AL2 AMI's source snapshot is 30GB and EBS volumes can never be created smaller than their snapshot (confirmed via a failed apply at 10GB). Combined with RDS's 20GB this exceeds the free tier's 30GB combined EBS allowance by ~20GB -- roughly $1.60/month at gp3 pricing, not worth fighting via a different AMI family."
  type        = number
  default     = 30
}
