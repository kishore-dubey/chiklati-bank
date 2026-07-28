output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecr_api_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "public_url" {
  value = "https://${var.public_domain}"
}

output "webhook_url" {
  value = "https://${var.public_domain}/webhooks/unit"
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "ec2_instance_id" {
  value = aws_instance.main.id
}

output "rds_endpoint" {
  value     = aws_db_instance.main.address
  sensitive = true
}

output "redis_endpoint" {
  value     = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive = true
}
