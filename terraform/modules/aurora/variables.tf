variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the Aurora subnet group"
  type        = list(string)
}

variable "aurora_sg_id" {
  description = "Security group ID to attach to Aurora"
  type        = string
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "database_name" {
  description = "Name of the initial database to create"
  type        = string
  default     = "parcel_db"
}

variable "master_username" {
  description = "Master DB username"
  type        = string
  default     = "parcel_admin"
}

variable "master_password" {
  description = "Master DB password (store in Secrets Manager, don't hardcode)"
  type        = string
  sensitive   = true
}

variable "serverless_min_capacity" {
  description = "Aurora Serverless v2 minimum ACUs (0.5 = cold start available)"
  type        = number
  default     = 0.5
}

variable "serverless_max_capacity" {
  description = "Aurora Serverless v2 maximum ACUs"
  type        = number
  default     = 4
}

variable "instance_count" {
  description = "Number of Aurora instances (1 for dev, 2+ for prod HA)"
  type        = number
  default     = 1
}

variable "deletion_protection" {
  description = "Prevent accidental cluster deletion"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on cluster deletion (set false for prod)"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Automated backup retention in days"
  type        = number
  default     = 7
}

variable "tags" {
  type    = map(string)
  default = {}
}
