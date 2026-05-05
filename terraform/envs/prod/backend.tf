################################################################################
# Remote State Backend — S3 + DynamoDB lock table
#
# BEFORE FIRST RUN:
#   1. Create the S3 bucket manually:
#      aws s3 mb s3://parcel-app-terraform-state-prod --region us-east-1
#      aws s3api put-bucket-versioning \
#        --bucket parcel-app-terraform-state-prod \
#        --versioning-configuration Status=Enabled
#
#   2. Create the DynamoDB lock table manually:
#      aws dynamodb create-table \
#        --table-name parcel-terraform-locks \
#        --attribute-definitions AttributeName=LockID,AttributeType=S \
#        --key-schema AttributeName=LockID,KeyType=HASH \
#        --billing-mode PAY_PER_REQUEST \
#        --region us-east-1
#
#   3. Run: terraform init
################################################################################

terraform {
  backend "s3" {
    bucket         = "parcel-app-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "parcel-terraform-locks"
    encrypt        = true
  }
}
