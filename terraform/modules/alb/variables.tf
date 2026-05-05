variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  description = "VPC ID for target group health checks"
  type        = string
}

variable "alb_sg_id" {
  description = "Security group ID to attach to the ALB"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs into which the ALB is deployed"
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener. Leave empty to use HTTP only (dev)."
  type        = string
  default     = ""
}

variable "enable_deletion_protection" {
  description = "Prevent accidental deletion of the ALB"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "S3 bucket name for ALB access logs. Leave empty to disable."
  type        = string
  default     = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
