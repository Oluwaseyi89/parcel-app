# Parcel App Terraform Infrastructure

Production-ready Terraform layout for the Parcel App architecture with independent deployment switches for each major component.

## What this provisions

- Networking: VPC, public/private subnets, IGW, NAT, route tables
- Security: security groups for ALB, ECS, Aurora, Redis
- Compute: ECS Fargate cluster + services (Django API, payment service, Celery worker/beat)
- Data: Aurora PostgreSQL Serverless v2, ElastiCache Redis, SQS + DLQ
- Frontends: S3 buckets + CloudFront distributions for web and admin
- Platform: ECR repos, Secrets Manager, CloudWatch alarms/dashboard, X-Ray group

Excluded by design:
- parcel-app-mobile
- parcel-app-react (legacy)

## Independent deployment

Each environment supports granular feature flags in terraform.tfvars:

- enable_frontend_web
- enable_frontend_admin
- enable_backend_api
- enable_payment_service
- enable_celery_worker
- enable_celery_beat
- enable_aurora
- enable_redis
- enable_sqs
- enable_monitoring

This lets you deploy partial stacks (for portfolio budget control), e.g. frontend-only, backend-only, or data-only.

## Directory structure

terraform/
  modules/
    alb/
    aurora/
    cloudfront/
    ecr/
    ecs_cluster/
    ecs_service/
    elasticache/
    monitoring/
    networking/
    s3_frontend/
    secrets/
    security_groups/
    sqs/
  envs/
    dev/
    staging/
    prod/

## Quick start

1) Choose an environment:

- terraform/envs/dev
- terraform/envs/staging
- terraform/envs/prod

2) Initialize and plan:

```bash
cd terraform/envs/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
```

3) Apply:

```bash
terraform apply
```

## Validate and plan only (no apply)

If you want to test configuration correctness without creating infrastructure:

```bash
cd terraform/envs/dev
terraform init -backend=false -reconfigure
terraform validate
terraform plan -lock=false
```

Notes:
- Using backend=false avoids remote state initialization.
- If backend.tf exists and Terraform still asks for backend init, run checks from a temporary copy with backend.tf removed.
- plan never creates resources; only apply creates resources.

Run all environments at once:

```bash
cd terraform
./tf-all.sh fmt
./tf-all.sh validate
./tf-all.sh plan
```

The plan command in tf-all.sh automatically uses a temporary backend-free workspace so it can run in no-apply mode even when backend.tf is present.

The script uses AWS SDK config loading and will use:
- AWS_PROFILE from your shell if set
- AWS_REGION/AWS_DEFAULT_REGION from your shell (or your AWS CLI configured region)

Equivalent Make targets:

```bash
cd terraform
make fmt-all
make validate-all
make plan-all
```

## AWS permissions required

To avoid plan/apply failures when credentials are valid, the IAM principal running Terraform needs permissions across the services used by this stack.

Minimum practical service coverage:
- sts: GetCallerIdentity
- ec2: VPC, subnet, route table, NAT gateway, EIP, IGW, security group, flow logs, VPC metadata
- iam: create/read/update/delete roles, policies, policy attachments, and pass roles to ECS/RDS/flow logs
- ecs: cluster, service, task definition, capacity provider strategy
- ecr: repository, lifecycle policy, image scan settings
- elasticloadbalancing: ALB, listeners, listener rules, target groups
- application-autoscaling: scalable targets and scaling policies for ECS services
- rds: Aurora cluster, instances, subnet group, parameter group
- elasticache: replication group, subnet group, parameter group
- sqs: queues, queue policies, queue attributes
- s3: bucket creation/configuration, encryption, lifecycle, public access blocks, bucket policy
- cloudfront: distribution, origin access control, distribution config updates
- secretsmanager: secret creation, versions, reads for secret references
- cloudwatch: log groups, alarms, dashboard operations
- sns: topic and subscription operations
- xray: group operations

Resource scope recommendations:
- For portfolio speed, allow these actions on resource * during initial rollout.
- For production hardening, reduce to least privilege by scoping ARNs to project and environment prefixes.

## Recommended IAM setup for first successful run

Option 1 (fastest for portfolio demo):
- Attach AdministratorAccess temporarily to the deployment principal.
- Run terraform plan and terraform apply.
- Replace with least-privilege policy after first stable deployment.

Option 2 (safer long term):
- Create a dedicated Terraform deployment role.
- Grant only the service permissions listed above, scoped to parcel-app naming prefixes.
- Include iam:PassRole for ECS task execution/task roles and RDS monitoring role.

## Backend bootstrap permissions

If you use remote state backend (S3 + DynamoDB lock table), the principal also needs:
- s3: create/list/get/put bucket and object operations for the state bucket
- dynamodb: create/read/update/delete table and item operations for lock table
- kms: encrypt/decrypt/data key permissions if using a customer-managed KMS key for backend encryption

## Important notes

- Update backend S3 bucket/DynamoDB lock table names in each env backend.tf before first init.
- Set real secrets in AWS Secrets Manager after bootstrap (Paystack, SMTP).
- For CloudFront custom domains, use ACM certificate in us-east-1.
- For ALB HTTPS, use ACM certificate in the workload region.
- Next.js app is currently modeled as static S3/CloudFront for your requested architecture; if SSR is required, add a dedicated Next.js ECS service and route via ALB.
