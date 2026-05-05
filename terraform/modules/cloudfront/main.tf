################################################################################
# Parcel App — CloudFront Distribution Module
#
# One distribution per frontend (web / admin).
# - S3 OAC for the static site bucket
# - Optional ALB origin for API routing (/api/*, /auth/*)
# - SPA support: 403/404 → 200 /index.html
# - Optional custom domain + ACM certificate (us-east-1 required)
# - Optional WAF WebACL
################################################################################

data "aws_region" "current" {}

# ── Origin Access Control (OAC) for S3 ────────────────────────────────────────
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.project}-${var.environment}-${var.app_name}-oac"
  description                       = "OAC for ${var.app_name} S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── CloudFront Distribution ────────────────────────────────────────────────────
resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project}-${var.environment}-${var.app_name}"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = length(var.domain_aliases) > 0 ? var.domain_aliases : null
  web_acl_id          = var.waf_web_acl_arn != "" ? var.waf_web_acl_arn : null

  # ── S3 static site origin ─────────────────────────────────────────────────
  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = "s3-${var.app_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  # ── Optional ALB origin (API gateway) ────────────────────────────────────
  dynamic "origin" {
    for_each = var.alb_dns_name != "" ? [1] : []
    content {
      domain_name = var.alb_dns_name
      origin_id   = "alb-api"

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
        origin_read_timeout    = 60
      }
    }
  }

  # ── Default cache behaviour → S3 static site ─────────────────────────────
  default_cache_behavior {
    target_origin_id       = "s3-${var.app_name}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized (managed)
    origin_request_policy_id   = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # CORS-S3Origin (managed)
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # SecurityHeadersPolicy (managed)
  }

  # ── ALB cache behaviour for API routes (forwarded, not cached) ────────────
  dynamic "ordered_cache_behavior" {
    for_each = var.alb_dns_name != "" ? var.api_path_patterns : []
    content {
      path_pattern           = ordered_cache_behavior.value
      target_origin_id       = "alb-api"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      # CachingDisabled (managed) + AllViewer origin request policy
      cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
      origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    }
  }

  # ── SPA error handling: 403/404 from S3 → serve index.html with 200 ──────
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # ── TLS / Viewer certificate ──────────────────────────────────────────────
  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == ""
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : "TLSv1"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${var.app_name}-cf"
    AppName = var.app_name
  })
}

# ── S3 bucket policy granting CloudFront OAC read access ──────────────────────
resource "aws_s3_bucket_policy" "cloudfront_oac" {
  bucket = var.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontServicePrincipal"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${var.s3_bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
        }
      }
    }]
  })
}
