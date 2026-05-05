output "primary_endpoint" {
  description = "Primary endpoint address for the Redis replication group"
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "reader_endpoint" {
  description = "Reader endpoint for Redis replicas"
  value       = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "port" {
  description = "Redis port (6379)"
  value       = aws_elasticache_replication_group.this.port
}

output "replication_group_id" {
  description = "Replication group ID"
  value       = aws_elasticache_replication_group.this.id
}
