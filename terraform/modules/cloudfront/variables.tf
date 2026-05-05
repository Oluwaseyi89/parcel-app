variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "app_name" {
  description = "Short name identifying the frontend app (e.g. 'web', 'admin')"
  type        = string
}

# ── S3 Origin ─────────────────────────────────────────────────────────────────
variable "s3_bucket_id" {
  description = "S3 bucket ID (name) — used for OAC bucket policy"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN — used in the bucket policy"
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name (from s3_frontend module output)"
  type        = string
}

# ── ALB Origin (optional) ─────────────────────────────────────────────────────
variable "alb_dns_name" {
  description = "ALB DNS name for API origin. Leave empty to skip."
  type        = string
  default     = ""
}

variable "api_path_patterns" {
  description = "Path patterns forwarded to the ALB origin (e.g. ['/api/*', '/auth/*'])"
  type        = list(string)
  default     = ["/api/*", "/auth/*"]
}

# ── Custom Domain / TLS ───────────────────────────────────────────────────────
variable "domain_aliases" {
  description = "Custom domain aliases (e.g. ['app.example.com']). Leave empty for *.cloudfront.net."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1). Leave empty to use CloudFront default cert."
  type        = string
  default     = ""
}

# ── Distribution Settings ─────────────────────────────────────────────────────
variable "price_class" {
  description = "CloudFront price class (PriceClass_100 = US/EU only, cheapest)"
  type        = string
  default     = "PriceClass_100"
}

variable "waf_web_acl_arn" {
  description = "WAF v2 WebACL ARN (us-east-1) to associate with this distribution"
  type        = string
  default     = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
