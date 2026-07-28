# Free while attached to a running instance -- gives Caddy's Let's Encrypt
# cert and Unit's webhook URL a stable DNS name across any future instance
# resize. Only costs money if later left unattached to a stopped instance.
resource "aws_eip" "main" {
  domain = "vpc"
  tags   = { Name = "${var.project_name}-eip" }
}
