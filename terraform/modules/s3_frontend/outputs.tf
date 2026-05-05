output "bucket_id" {
  description = "S3 bucket ID (name)"
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name — use as CloudFront S3 origin domain"
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}
