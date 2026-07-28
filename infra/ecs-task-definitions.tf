resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}/api"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${var.project_name}/worker"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.project_name}/web"
  retention_in_days = var.log_retention_days
}

locals {
  api_worker_secrets = [
    { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
    { name = "UNIT_API_TOKEN", valueFrom = aws_ssm_parameter.unit_api_token.arn },
    { name = "UNIT_WEBHOOK_SECRET", valueFrom = aws_ssm_parameter.unit_webhook_secret.arn },
    { name = "INTERNAL_API_SECRET", valueFrom = aws_ssm_parameter.internal_api_secret.arn },
  ]

  api_worker_env = [
    { name = "NODE_ENV", value = "production" },
    { name = "ENABLE_SANDBOX_ROUTES", value = "true" },
    { name = "UNIT_API_BASE_URL", value = var.unit_api_base_url },
    { name = "UNIT_DEFAULT_DEPOSIT_PRODUCT", value = var.unit_default_deposit_product },
    { name = "REDIS_URL", value = local.redis_url },
  ]
}

# Note: `image` below is a placeholder ("latest"). Real deploys register new
# task definition revisions directly (see .github/workflows/deploy.yml) with
# the actual SHA-tagged image -- Terraform only establishes the initial shape.
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  requires_compatibilities = ["EC2"]
  network_mode             = "host"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name              = "api"
    image             = "${aws_ecr_repository.api.repository_url}:latest"
    essential         = true
    command           = ["node", "dist/server.js"]
    workingDirectory  = "/app/apps/api"
    memoryReservation = 300
    portMappings      = [{ containerPort = 4000, hostPort = 4000, protocol = "tcp" }]
    environment       = concat(local.api_worker_env, [{ name = "PORT", value = "4000" }])
    secrets           = local.api_worker_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
  }])

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.project_name}-worker"
  requires_compatibilities = ["EC2"]
  network_mode             = "host"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name              = "worker"
    image             = "${aws_ecr_repository.api.repository_url}:latest"
    essential         = true
    command           = ["node", "dist/worker.js"]
    workingDirectory  = "/app/apps/api"
    memoryReservation = 200
    environment       = concat(local.api_worker_env, [{ name = "PORT", value = "4000" }])
    secrets           = local.api_worker_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.worker.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "worker"
      }
    }
  }])

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

resource "aws_ecs_task_definition" "web" {
  family                   = "${var.project_name}-web"
  requires_compatibilities = ["EC2"]
  network_mode             = "host"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name              = "web"
    image             = "${aws_ecr_repository.web.repository_url}:latest"
    essential         = true
    memoryReservation = 380
    portMappings      = [{ containerPort = 3000, hostPort = 3000, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" },
      { name = "HOSTNAME", value = "0.0.0.0" },
      { name = "NEXTAUTH_URL", value = "https://${aws_eip.main.public_dns}" },
      { name = "API_URL", value = "http://localhost:4000" },
    ]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
      { name = "NEXTAUTH_SECRET", valueFrom = aws_ssm_parameter.nextauth_secret.arn },
      { name = "INTERNAL_API_SECRET", valueFrom = aws_ssm_parameter.internal_api_secret.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.web.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "web"
      }
    }
  }])

  lifecycle {
    ignore_changes = [container_definitions]
  }
}
