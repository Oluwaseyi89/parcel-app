# PostgreSQL Migration Guide

## Overview
This document outlines the migration from MySQL 8.x to PostgreSQL for the Parcel Payment Service application.

## Key Changes

### 1. Database Driver
- **MySQL**: `mysql-connector-j`
- **PostgreSQL**: `org.postgresql:postgresql`

### 2. JDBC Connection String
```properties
# MySQL
jdbc:mysql://localhost:3306/parcel_db

# PostgreSQL
jdbc:postgresql://localhost:5432/parcel_db
```

### 3. Hibernate Dialect
- **MySQL**: `org.hibernate.dialect.MySQL8Dialect`
- **PostgreSQL**: `org.hibernate.dialect.PostgreSQLDialect`

### 4. Data Types
| MySQL | PostgreSQL | Notes |
|-------|-----------|-------|
| INT | INTEGER or SERIAL | Use SERIAL for auto-increment |
| VARCHAR(255) | VARCHAR(255) | Compatible |
| BOOLEAN | BOOLEAN | Compatible |
| TIMESTAMP | TIMESTAMP | Use DEFAULT CURRENT_TIMESTAMP |

### 5. Sequence Handling
PostgreSQL uses sequences for auto-increment. The `SERIAL` data type automatically creates a sequence.

### 6. Case Sensitivity
PostgreSQL folds unquoted identifiers to lowercase. The schema uses lowercase table and column names for consistency.

## Entity Changes

All entities have been refactored:

### Data Type Updates
- `int` → `Long` (for IDs using SERIAL/IDENTITY)
- `String` → `LocalDateTime` (for timestamp fields)
- Removed String-based date fields

### Timestamp Handling
- Changed from `String` type (created_at, updated_at)
- Now uses `LocalDateTime` with `@Temporal(TemporalType.TIMESTAMP)`
- PostgreSQL automatically handles timestamp conversion

### Column Annotations
Added proper JPA annotations:
- `@Column(name = "field_name")` for snake_case naming
- `@Column(nullable = false)` for NOT NULL constraints
- `@Column(unique = true)` for unique constraints
- `columnDefinition` for default values

## Setup Instructions

### 1. Install PostgreSQL
```bash
# Windows
winget install PostgreSQL.PostgreSQL

# macOS
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database and User
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE parcel_db;

-- Create database for development
CREATE DATABASE parcel_db_dev;

-- Create user (optional, for security)
CREATE USER parcel_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE parcel_db TO parcel_user;
GRANT ALL PRIVILEGES ON DATABASE parcel_db_dev TO parcel_user;
```

### 3. Update Application Configuration

#### For Development (application-dev.properties):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/parcel_db_dev
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=validate
```

#### For Production (application-prod.properties):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/parcel_db
spring.datasource.username=parcel_user
spring.datasource.password=secure_password
spring.jpa.hibernate.ddl-auto=validate
```

### 4. Initialize Database Schema

**Option A: Automatic (Spring Boot)**
```properties
spring.sql.init.mode=always
spring.sql.init.data-locations=classpath:schema.sql
```

**Option B: Manual**
```bash
psql -U postgres -d parcel_db -f src/main/resources/schema.sql
```

### 5. Build and Run
```bash
./gradlew clean build
./gradlew bootRun --args='--spring.profiles.active=dev'
```

## Data Migration from MySQL

If migrating from existing MySQL database:

### 1. Export Data from MySQL
```bash
mysqldump -u root -p parcel_db > backup.sql
```

### 2. Convert SQL Syntax
- Update `AUTO_INCREMENT` to `SERIAL`
- Update engine declarations (MySQL-specific)
- Update data types as needed

### 3. Import to PostgreSQL
```bash
psql -U postgres -d parcel_db -f converted_backup.sql
```

### Example Conversion Script
```sql
-- MySQL dump excerpt
CREATE TABLE user_payment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ...
) ENGINE=InnoDB;

-- Convert to PostgreSQL
CREATE TABLE user_payment (
  id SERIAL PRIMARY KEY,
  ...
);
```

## Important Differences

### 1. String Concatenation
```java
// MySQL: CONCAT(col1, col2)
// PostgreSQL: col1 || col2
```

### 2. Date Functions
```java
// MySQL: NOW()
// PostgreSQL: CURRENT_TIMESTAMP
```

### 3. Boolean Handling
PostgreSQL has native BOOLEAN type - compatible with Java Boolean objects.

### 4. NULL Handling
Both databases handle NULLs similarly, but PostgreSQL is stricter with type checking.

## Testing

### Verify Database Connection
```bash
./gradlew bootRun
# Check logs for successful connection
```

### Test Queries
```sql
-- Connect to PostgreSQL
psql -U postgres -d parcel_db

-- Verify tables
\dt

-- Check table structure
\d user_payment
```

## Performance Tuning

### Connection Pooling (HikariCP)
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

### Indexes
The schema.sql automatically creates indexes for:
- user_payment.email
- Foreign key columns
- Status and reference columns

### Query Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM user_payment WHERE email = 'test@example.com';
```

## Troubleshooting

### Connection Issues
```
Error: Connection refused (localhost:5432)
Solution: Ensure PostgreSQL service is running
```

### Authentication Failed
```
Error: FATAL: password authentication failed
Solution: Verify credentials in application.properties
```

### Type Mismatch
```
Error: column "X" is of type integer but expression is of type character
Solution: Check entity field types match database schema
```

### Sequence Issues
```
Error: relation "user_payment_id_seq" does not exist
Solution: Recreate sequence or drop and recreate table
```

## Rollback Plan

If needed to revert to MySQL:

1. Update build.gradle:
```gradle
runtimeOnly 'com.mysql:mysql-connector-j'
```

2. Update application properties:
```properties
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/parcel_db
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

3. Restore MySQL schema from backup
4. Run application with MySQL

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Hibernate PostgreSQL Dialect](https://docs.jboss.org/hibernate/orm/6.0/userguide/html_single/)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [HikariCP Connection Pool](https://github.com/brettwooldridge/HikariCP)

## Support

For issues or questions:
1. Check PostgreSQL logs: `/var/log/postgresql/postgresql.log`
2. Review Spring Boot logs for Hibernate output
3. Consult project README for general setup
