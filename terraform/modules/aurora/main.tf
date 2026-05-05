################################################################################
# Parcel App — Aurora PostgreSQL Serverless v2 Module
################################################################################

resource "aws_db_subnet_group" "this" {
  name       = "${var.project}-${var.environment}-aurora-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-aurora-subnet-group" })
}

resource "aws_rds_cluster_parameter_group" "this" {
  name        = "${var.project}-${var.environment}-aurora-pg15"
  family      = "aurora-postgresql15"
  description = "Custom parameter group for ${var.project}-${var.environment}"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = var.tags
}

resource "aws_rds_cluster" "this" {
  cluster_identifier = "${var.project}-${var.environment}-aurora"
  engine             = "aurora-postgresql"
  # Aurora Serverless v2 uses engine_mode = "provisioned" with serverlessv2_scaling_configuration
  engine_mode     = "provisioned"
  engine_version  = var.engine_version
  database_name   = var.database_name
  master_username = var.master_username
  master_password = var.master_password

  serverlessv2_scaling_configuration {
    min_capacity = var.serverless_min_capacity
    max_capacity = var.serverless_max_capacity
  }

  db_subnet_group_name            = aws_db_subnet_group.this.name
  vpc_security_group_ids          = [var.aurora_sg_id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.this.name

  storage_encrypted            = true
  deletion_protection          = var.deletion_protection
  skip_final_snapshot          = var.skip_final_snapshot
  final_snapshot_identifier    = var.skip_final_snapshot ? null : "${var.project}-${var.environment}-aurora-final"
  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = "02:00-03:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, { Name = "${var.project}-${var.environment}-aurora" })

  lifecycle {
    # Prevent password changes from forcing cluster replacement
    ignore_changes = [master_password]
  }
}

# Serverless v2 requires at least one instance with instance_class = "db.serverless"
resource "aws_rds_cluster_instance" "this" {
  count = var.instance_count

  identifier         = "${var.project}-${var.environment}-aurora-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.this.engine
  engine_version     = aws_rds_cluster.this.engine_version

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_enhanced_monitoring.arn

  tags = var.tags
}

# ── Enhanced Monitoring Role ───────────────────────────────────────────────────
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project}-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
