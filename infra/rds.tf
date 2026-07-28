resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.rds_instance_class

  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  # Sits in the default VPC's public *subnets* (no NAT Gateway, to stay free)
  # but is not internet-reachable -- enforced by this flag plus the RDS
  # security group only allowing the EC2 host. Accepted POC tradeoff, not
  # "real bank" network isolation.
  publicly_accessible = false

  multi_az                = false
  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false

  apply_immediately = true
}
