################################################################################
# Parcel App — ElastiCache Redis Module
# Used as: Celery broker, Celery result backend, Django session cache
################################################################################

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.project}-${var.environment}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = var.tags
}

resource "aws_elasticache_parameter_group" "this" {
  name   = "${var.project}-${var.environment}-redis7"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = var.tags
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${var.project}-${var.environment}-redis"
  description          = "Redis for ${var.project} ${var.environment} — Celery broker and session cache"

  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.this.name
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [var.redis_sg_id]
  port                 = 6379

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.auth_token

  # Multi-AZ failover requires at least 2 nodes
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled           = var.num_cache_nodes > 1

  snapshot_retention_limit = var.snapshot_retention_days
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "sun:05:00-sun:06:00"

  apply_immediately = var.apply_immediately

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-redis" })

  lifecycle {
    ignore_changes = [auth_token]
  }
}
