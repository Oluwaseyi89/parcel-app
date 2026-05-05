variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "app_name" {
  description = "Short name used in the bucket name (e.g. 'web', 'admin')"
  type        = string
}

variable "enable_versioning" {
  description = "Enable S3 versioning for rollback capability"
  type        = bool
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
