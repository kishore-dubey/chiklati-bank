resource "aws_ecs_cluster" "main" {
  name = var.project_name

  setting {
    name  = "containerInsights"
    value = "disabled" # avoid extra CloudWatch metrics cost/free-tier pressure
  }
}
