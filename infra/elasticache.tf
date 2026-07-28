resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = var.elasticache_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.1"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]
}
