# Quick Start Guide - PostgreSQL Setup

## 🚀 5-Minute Setup

### Prerequisites
- Java 17 or higher
- PostgreSQL 12+ (download from [postgresql.org](https://www.postgresql.org/download/))
- Gradle (included via wrapper)

### Step 1: Install PostgreSQL (if not already installed)

**Windows:**
```powershell
winget install PostgreSQL.PostgreSQL
# During installation, note the password you set for 'postgres' user
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Databases

```sql
-- Open PostgreSQL terminal
psql -U postgres

-- Create databases
CREATE DATABASE parcel_db;
CREATE DATABASE parcel_db_dev;

-- Verify
\l
-- Should show both databases

-- Exit
\q
```

### Step 3: Update Configuration (Optional)

If your PostgreSQL password is NOT `postgres`, update the properties:

**For Development:**
```properties
# src/main/resources/application-dev.properties

spring.datasource.password=YOUR_PASSWORD
```

**For Production:**
```properties
# src/main/resources/application-prod.properties

spring.datasource.password=YOUR_PASSWORD
```

### Step 4: Build Project

```bash
cd /path/to/parcel-app-payment-springboot
./gradlew clean build
```

### Step 5: Run Application

```bash
# Development mode (recommended for testing)
./gradlew bootRun --args='--spring.profiles.active=dev'

# Or production mode
./gradlew bootRun --args='--spring.profiles.active=prod'
```

**Expected Output:**
```
Started ParcelApplication in X.XXX seconds
Tomcat started on port(s): 8080 with context path ''
```

### Step 6: Verify Setup

```bash
# Test the application
curl http://localhost:8080/home

# Check database
psql -U postgres -d parcel_db_dev
\dt
# Should show 5 tables:
# - user_payment
# - parcel_product_product
# - parcel_order_orderdetail
# - parcel_order_orderitem
# - parcel_order_paymentdetail
```

## 📋 Database Schema

The `schema.sql` file is automatically executed on startup and creates:

| Table | Purpose |
|-------|---------|
| user_payment | Customer information |
| parcel_product_product | Product inventory |
| parcel_order_orderdetail | Order records |
| parcel_order_orderitem | Order line items |
| parcel_order_paymentdetail | Payment transactions |

All tables include:
- Auto-incrementing ID
- Created/updated timestamps
- Foreign key relationships
- Indexes for performance

## 🔧 Common Issues

### Issue: "Connection refused (localhost:5432)"
**Solution:** Ensure PostgreSQL is running
```bash
# Check PostgreSQL status
pg_isready

# Restart PostgreSQL if needed
sudo systemctl restart postgresql  # Linux
brew services restart postgresql@15  # macOS
```

### Issue: "password authentication failed"
**Solution:** Update database password
1. Verify you're using the correct password
2. Update in `application.properties` or environment variable
3. Or reset PostgreSQL password:
```sql
ALTER USER postgres WITH PASSWORD 'new_password';
```

### Issue: "database parcel_db does not exist"
**Solution:** Create the database
```sql
psql -U postgres
CREATE DATABASE parcel_db;
\q
```

### Issue: Tables not created
**Solution:** Ensure `schema.sql` is loaded
1. Check `spring.sql.init.mode=always` in application.properties
2. Check `spring.sql.init.data-locations=classpath:schema.sql`
3. Restart application

## 📊 Test the API

### Insert a User
```bash
curl -X POST http://localhost:8080/submitPayer \
  -d "email=test@example.com&firstName=John&lastName=Doe"
```

### Get Home Page
```bash
curl http://localhost:8080/home
```

### Initialize Payment
```bash
curl -X POST http://localhost:8080/v1/initializetransaction \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10000",
    "email": "test@example.com",
    "reference": "ref_123456"
  }'
```

## 🔐 Production Checklist

Before deploying to production:

- [ ] PostgreSQL server is secure and backed up
- [ ] Database credentials are in environment variables (not hardcoded)
- [ ] `spring.jpa.hibernate.ddl-auto=validate` (never `create` or `update`)
- [ ] Connection pooling is configured (HikariCP settings in application-prod.properties)
- [ ] Firewall allows only necessary ports (5432 for DB, 8080 for app)
- [ ] Database backups are scheduled
- [ ] Application is built with `./gradlew bootJar`
- [ ] JAR is run with production profile: `java -jar app.jar --spring.profiles.active=prod`

## 📚 Documentation

For more detailed information:
- See `POSTGRESQL_MIGRATION.md` for complete migration guide
- See `POSTGRESQL_MIGRATION_SUMMARY.md` for change summary
- See `README.md` for general project information

## 🎯 Next Steps

1. ✅ Databases created
2. ✅ Project built
3. ✅ Application running
4. → Load sample data (optional)
5. → Test API endpoints
6. → Integrate with Paystack
7. → Deploy to production

## 💡 Tips

**Run in background (development):**
```bash
nohup ./gradlew bootRun > app.log 2>&1 &
```

**View real-time logs:**
```bash
tail -f app.log
```

**Stop application:**
```bash
# Find and kill process
ps aux | grep java
kill -9 <PID>
```

**Build without tests (faster):**
```bash
./gradlew bootJar -x test
```

---

**✨ Ready to go!** Your PostgreSQL-backed Spring Boot application is now running.
