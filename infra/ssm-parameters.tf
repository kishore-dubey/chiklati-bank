locals {
  ssm_prefix = "/${var.project_name}"

  database_url = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}?schema=public"
  redis_url    = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379"
}

# SecureString on the default AWS-managed KMS key -- Secrets Manager would
# cost $0.40/secret/month; this is free.
resource "aws_ssm_parameter" "database_url" {
  name  = "${local.ssm_prefix}/DATABASE_URL"
  type  = "SecureString"
  value = local.database_url
}

resource "aws_ssm_parameter" "unit_api_token" {
  name  = "${local.ssm_prefix}/UNIT_API_TOKEN"
  type  = "SecureString"
  value = var.unit_api_token
}

resource "aws_ssm_parameter" "unit_webhook_secret" {
  name  = "${local.ssm_prefix}/UNIT_WEBHOOK_SECRET"
  type  = "SecureString"
  value = var.unit_webhook_secret
}

resource "aws_ssm_parameter" "nextauth_secret" {
  name  = "${local.ssm_prefix}/NEXTAUTH_SECRET"
  type  = "SecureString"
  value = var.nextauth_secret
}

resource "aws_ssm_parameter" "internal_api_secret" {
  name  = "${local.ssm_prefix}/INTERNAL_API_SECRET"
  type  = "SecureString"
  value = var.internal_api_secret
}
