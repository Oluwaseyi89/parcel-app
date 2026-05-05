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

## Important notes

- Update backend S3 bucket/DynamoDB lock table names in each env backend.tf before first init.
- Set real secrets in AWS Secrets Manager after bootstrap (Paystack, SMTP).
- For CloudFront custom domains, use ACM certificate in us-east-1.
- For ALB HTTPS, use ACM certificate in the workload region.
- Next.js app is currently modeled as static S3/CloudFront for your requested architecture; if SSR is required, add a dedicated Next.js ECS service and route via ALB.
