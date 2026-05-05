output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.this.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint (load-balanced across replicas)"
  value       = aws_rds_cluster.this.reader_endpoint
}

output "cluster_port" {
  description = "Database port (5432)"
  value       = aws_rds_cluster.this.port
}

output "database_name" {
  description = "Initial database name"
  value       = aws_rds_cluster.this.database_name
}

output "master_username" {
  description = "Master username"
  value       = aws_rds_cluster.this.master_username
}

output "cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.this.cluster_identifier
}
