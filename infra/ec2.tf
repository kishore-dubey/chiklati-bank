# A single pinned EC2 instance is the ECS cluster's only container instance
# (EC2 launch type schedules onto whatever's registered -- an ASG/capacity
# provider isn't required, and would only complicate keeping a static Elastic
# IP attached to a single instance we never actually want to scale).
resource "aws_instance" "main" {
  ami                    = data.aws_ssm_parameter.ecs_ami.value
  instance_type          = var.ec2_instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_instance.name

  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tpl", {
    ecs_cluster_name = aws_ecs_cluster.main.name
    public_dns       = aws_eip.main.public_dns
  })

  tags = { Name = "${var.project_name}-host" }
}

resource "aws_eip_association" "main" {
  instance_id   = aws_instance.main.id
  allocation_id = aws_eip.main.id
}
