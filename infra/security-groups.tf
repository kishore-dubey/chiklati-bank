resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2"
  description = "chiklati-bank EC2 host: public HTTP/HTTPS via Caddy, no SSH (use SSM Session Manager instead)"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP (Caddy redirects to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-ec2" }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds"
  description = "chiklati-bank RDS: Postgres from the EC2 host only, never public"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Postgres from EC2 host"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds" }
}

resource "aws_security_group" "elasticache" {
  name        = "${var.project_name}-elasticache"
  description = "chiklati-bank ElastiCache: Redis from the EC2 host only, never public"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Redis from EC2 host"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-elasticache" }
}
