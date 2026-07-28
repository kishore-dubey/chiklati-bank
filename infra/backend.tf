# Terraform doesn't allow variables in a backend block. Fill in the bucket
# and table names printed by `terraform output` in infra/bootstrap after you
# apply that once -- or override at init time with:
#   terraform init -backend-config="bucket=..." -backend-config="dynamodb_table=..."
terraform {
  backend "s3" {
    bucket         = "chiklati-bank-terraform-state"
    key            = "chiklati-bank/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "chiklati-bank-terraform-lock"
    encrypt        = true
    # Backend blocks can't reference variables, so the named profile has to
    # be repeated here even though providers.tf also sets it.
    profile = "chiklati-bank"
  }
}
