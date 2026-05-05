output "vpc_id" {
  value = module.networking.vpc_id
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.networking.private_subnet_ids
}

output "ecs_cluster_name" {
  value = module.ecs_cluster.cluster_name
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "django_service_name" {
  value = try(module.django_api[0].service_name, null)
}

output "payment_service_name" {
  value = try(module.payment_service[0].service_name, null)
}

output "celery_worker_service_name" {
  value = try(module.celery_worker[0].service_name, null)
}

output "aurora_endpoint" {
  value = try(module.aurora[0].cluster_endpoint, null)
}

output "redis_endpoint" {
  value = try(module.elasticache[0].primary_endpoint, null)
}

output "sqs_queue_url" {
  value = try(module.sqs[0].queue_url, null)
}

output "web_bucket_name" {
  value = try(module.web_frontend_bucket[0].bucket_id, null)
}

output "admin_bucket_name" {
  value = try(module.admin_frontend_bucket[0].bucket_id, null)
}

output "web_cloudfront_domain" {
  value = try(module.web_cloudfront[0].distribution_domain_name, null)
}

output "admin_cloudfront_domain" {
  value = try(module.admin_cloudfront[0].distribution_domain_name, null)
}
