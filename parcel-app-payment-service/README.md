# Parcel Payment Service - Spring Boot 3.4.0

A modern, containerized payment processing service built with Spring Boot 3.4.0, PostgreSQL, and integrated with Paystack payment gateway. This service handles order management, payment transactions, and inventory tracking for a parcel/e-commerce platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Docker Deployment](#docker-deployment)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Parcel Payment Service is a RESTful API that manages:
- **User Accounts**: Customer registration and profile management
- **Products**: Inventory management with stock tracking
- **Orders**: Order creation and status management
- **Payments**: Payment processing via Paystack with verification
- **Order Items**: Line items linking orders to products

The service uses a **3-tier architecture**:
1. **Controller Layer** — REST endpoints handling HTTP requests
2. **Service Layer** — Business logic and orchestration
3. **Repository Layer** — Data access via Spring Data JPA

## 🏗️ Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Client Application                  │
│              (Web, Mobile, Third-party)              │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────┐
│              Spring Boot Application                 │
│                   (Port 8080)                        │
├─────────────────────────────────────────────────────┤
│ Controllers                                         │
│ ├── InitializeTransactionController                │
│ ├── ParcelController                               │
│ └── [Verifies payments, handles orders]            │
├─────────────────────────────────────────────────────┤
│ Services                                            │
│ ├── InitializeTransactionService                  │
│ ├── VerificationService                           │
│ └── [Business logic, payment processing]          │
├─────────────────────────────────────────────────────┤
│ Repositories (JPA)                                  │
│ ├── OrderRepo, OrderItemRepo                      │
│ ├── PaymentRepo, ProductRepo                      │
│ └── [Database CRUD operations]                    │
└────────────┬────────────────────────────────────────┘
             │ JDBC
             ▼
┌─────────────────────────────────────────────────────┐
│         PostgreSQL Database (Port 5432)             │
│  ├── user_payment (Customers)                      │
│  ├── parcel_product_product (Products)             │
│  ├── parcel_order_orderdetail (Orders)             │
│  ├── parcel_order_orderitem (Line Items)           │
│  └── parcel_order_paymentdetail (Payments)         │
└─────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
parcel-app-payment-springboot/
│
├── src/
│   ├── main/
│   │   ├── java/com/deextralucid/parcel/
│   │   │   ├── ParcelApplication.java                    # Main entry point
│   │   │   ├── parcelcontroller/
│   │   │   │   └── ParcelController.java                 # REST endpoints
│   │   │   ├── parcelmodel/
│   │   │   │   ├── UserPayment.java                      # Customer entity
│   │   │   │   └── PaymentDetail.java                    # Payment record
│   │   │   ├── paystack/
│   │   │   │   ├── InitializeTransactionController.java   # Payment API
│   │   │   │   ├── InitializeTransactionService.java      # Payment logic
│   │   │   │   ├── InitializeTransactionServiceImpl.java   # Implementation
│   │   │   │   ├── orderpaymentcrud/
│   │   │   │   │   ├── OrderRepo.java
│   │   │   │   │   ├── OrderItemRepo.java
│   │   │   │   │   ├── PaymentRepo.java
│   │   │   │   │   └── ProductRepo.java
│   │   │   │   ├── ordersandpayments/
│   │   │   │   │   ├── Order.java
│   │   │   │   │   ├── OrderItem.java
│   │   │   │   │   ├── Payment.java
│   │   │   │   │   └── Product.java
│   │   │   │   └── verifypaystack/
│   │   │   │       ├── VerificationService.java
│   │   │   │       ├── VerificationServiceImpl.java
│   │   │   │       └── [DTOs & supporting classes]
│   │   │   │
│   │   │   └── parcelcrud/
│   │   │       ├── ParcelCrud.java
│   │   │       └── PaymentCrud.java
│   │   │
│   │   └── resources/
│   │       ├── application.properties                     # Main config
│   │       ├── application-dev.properties                 # Dev profile
│   │       ├── application-prod.properties                # Prod profile
│   │       ├── schema.sql                                 # Database schema
│   │       ├── data.sql                                   # Sample data
│   │       └── static/
│   │           ├── bootstrap.min.css
│   │           ├── bootstrap.min.js
│   │           ├── jquery-3.6.0.js
│   │           └── myApp.js
│   │
│   └── test/
│       └── java/.../ParcelApplicationTests.java           # Integration tests
│
├── gradle/                                                # Gradle wrapper
├── build.gradle                                           # Build configuration
├── settings.gradle                                        # Project settings
├── gradle.properties                                      # Gradle properties
│
├── Dockerfile                                             # Docker image definition
├── docker-compose.yml                                     # Docker Compose config
├── .dockerignore                                          # Docker build ignore
│
├── README.md                                              # This file
├── QUICK_START.md                                         # Quick start guide
├── DOCKER_SETUP.md                                        # Docker deployment
└── POSTGRESQL_MIGRATION.md                                # Migration details
```

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Spring Boot | 3.4.0 (Latest LTS) |
| **Language** | Java | 17 LTS |
| **ORM** | Hibernate + JPA | 6.x |
| **Database** | PostgreSQL | 12+ |
| **Build Tool** | Gradle | 8.6 |
| **Connection Pool** | HikariCP | 5.x |
| **Testing** | JUnit 5 + Spring Boot Test | 5.x |
| **JSON Processing** | Jackson | 2.x |
| **Container** | Docker | Latest |
| **Orchestration** | Docker Compose | 3.8 |

## ✨ Features

### 1. **Payment Processing**
- Initialize payment transactions via Paystack
- Verify payment status and update records
- Handle payment success/failure scenarios
- Store payment reference for tracking

### 2. **Order Management**
- Create and track orders
- Manage order status (pending, completed)
- Store customer and shipping information
- Link orders to products via order items

### 3. **Inventory Management**
- Track product stock levels
- Reduce inventory on successful payment
- Store vendor and product information
- Support product categorization

### 4. **Customer Management**
- Register and store customer information
- Maintain unique email constraints
- Track customer payment history

### 5. **Database Features**
- Idempotent schema initialization
- Foreign key relationships with cascading rules
- Indexes for performance optimization
- Timestamp tracking (created_at, updated_at)

### 6. **API Design**
- RESTful endpoints following HTTP conventions
- JSON request/response payloads
- CORS enabled for cross-origin requests
- Versioned API paths (`/v1/...`)

## 🚀 Getting Started

### Prerequisites

- Java 17 LTS
- PostgreSQL 12+
- Docker & Docker Compose (optional)
- Gradle 8.5+ (or use included wrapper)

### Quick Setup (Local Development)

#### 1. Clone the Repository
```bash
git clone https://github.com/Oluwaseyi89/parcel-app-payment-springboot.git
cd parcel-app-payment-springboot
```

#### 2. Setup PostgreSQL
```bash
# Create databases
psql -U postgres
CREATE DATABASE parcel_app_db;
CREATE DATABASE parcel_db_dev;
\q
```

#### 3. Build and Run
```bash
# Build the project
./gradlew clean build

# Run with dev profile
./gradlew bootRun --args='--spring.profiles.active=dev'
```

#### 4. Verify
```bash
curl http://localhost:8080/home
```

**See** [QUICK_START.md](QUICK_START.md) **for detailed instructions**

## ⚙️ Configuration

### Environment Profiles

**Development** (`application-dev.properties`)
- DDL Auto: `create-drop` (recreate schema)
- SQL Logging: Enabled
- Database: `parcel_db_dev`

**Production** (`application-prod.properties`)
- DDL Auto: `validate` (schema must exist)
- SQL Logging: Disabled
- Database: `parcel_app_db`

### Key Properties

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/parcel_app_db
spring.datasource.username=parcel_app_user
spring.datasource.password=parcelapp123
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## 🔌 API Endpoints

### Payment Initialization
```
POST /v1/initializetransaction
Content-Type: application/json

{
  "amount": "10000",
  "email": "user@example.com",
  "reference": "ref_123456"
}

Response: { "status": true, "data": { "authorization_url": "..." } }
```

### Payment Verification
```
GET /v1/verifypayment/{paymentRef}

Response: true (success) or false (failed)
Side Effects: Updates Payment, Order, OrderItems, and Product inventory
```

### Payment Details
```
GET /v1/verifypaydetail/{paymentRef}

Response: Detailed payment information from Paystack
```

### Submit Payer
```
POST /submitPayer
Parameters: email, firstName, lastName
```

### Home
```
GET /home
Response: HTML home page
```

## 📊 Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `user_payment` | Customer information |
| `parcel_product_product` | Product inventory |
| `parcel_order_orderdetail` | Order records |
| `parcel_order_orderitem` | Order line items |
| `parcel_order_paymentdetail` | Payment transactions |

### Key Features
- BIGSERIAL IDs (Long in Java)
- Foreign key relationships with CASCADE/RESTRICT
- Indexes on email, order_id, product_id, reference, status
- Automatic timestamps (created_at, updated_at)

**Full schema:** See `src/main/resources/schema.sql`

## 🐳 Docker Deployment

### Quick Start
```bash
docker-compose up --build
```

Access: `http://localhost:8080/home`

### Services
- **PostgreSQL** - Port 5432 (persistent volume)
- **Spring Boot** - Port 8080 (production profile)

**Full guide:** See [DOCKER_SETUP.md](DOCKER_SETUP.md)

## 👨‍💻 Development Guide

### Build for Production
```bash
./gradlew bootJar -x test
java -jar build/libs/parcel-app-payment-1.0.0.jar --spring.profiles.active=prod
```

### Run Tests
```bash
./gradlew test
```

### Code Structure
- **Controllers** - HTTP request handlers
- **Services** - Business logic
- **Repositories** - Data access (Spring Data JPA)
- **Entities** - JPA-annotated models
- **DTOs** - Data transfer objects

## 🔧 Troubleshooting

### Build Issues
```bash
gradle wrapper --gradle-version 8.6
./gradlew clean build --stacktrace
```

### Database Issues
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check schema
psql -U parcel_app_user -d parcel_app_db -c "\dt"
```

### Application Issues
- **Port 8080 in use:** Change `server.port` in `application.properties`
- **CORS errors:** Ensure `@CrossOrigin` is set on controller
- **Schema errors:** Check `schema.sql` syntax and entity definitions

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Paystack API Reference](https://paystack.com/developers)
- [Docker Documentation](https://docs.docker.com/)
- [JPA Specification](https://jakarta.ee/specifications/persistence/)

## 📝 License

Proprietary software for the Parcel Application platform.

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Status:** Production Ready ✅
