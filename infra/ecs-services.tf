resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "EC2"

  depends_on = [aws_instance.main]

  # The CD workflow registers new task-def revisions and updates the service
  # directly (see .github/workflows/deploy.yml) -- without this, a later
  # `terraform apply` would roll the service back to Terraform's placeholder
  # revision and undo every deploy.
  lifecycle {
    ignore_changes = [task_definition]
  }
}

resource "aws_ecs_service" "worker" {
  name            = "${var.project_name}-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "EC2"

  depends_on = [aws_instance.main]

  lifecycle {
    ignore_changes = [task_definition]
  }
}

resource "aws_ecs_service" "web" {
  name            = "${var.project_name}-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "EC2"

  depends_on = [aws_instance.main]

  lifecycle {
    ignore_changes = [task_definition]
  }
}
