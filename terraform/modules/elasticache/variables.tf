variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the ElastiCache subnet group"
  type        = list(string)
}

variable "redis_sg_id" {
  description = "Security group ID to attach to Redis"
  type        = string
}

variable "node_type" {
  description = "ElastiCache node instance type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (1 for dev, 2+ for prod with multi-AZ)"
  type        = number
  default     = 1
}

variable "auth_token" {
  description = "Redis AUTH token for transit encryption (min 16 chars)"
  type        = string
  sensitive   = true
}

variable "snapshot_retention_days" {
  description = "Number of days to retain Redis snapshots"
  type        = number
  default     = 1
}

variable "apply_immediately" {
  description = "Apply cluster changes immediately (may cause brief downtime)"
  type        = bool
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
