-- FieldForge Core Relational Tables (InnoDB Engine)
-- Conforms to SRS Section 5: Database Schema & Relational Modeling

CREATE DATABASE IF NOT EXISTS fieldforge;
USE fieldforge;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('BUYER', 'TECHNICIAN', 'DISPATCHER', 'ADMIN') NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    status ENUM('PENDING', 'ACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS buyer_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    billing_address TEXT NOT NULL,
    escrow_balance DECIMAL(12, 2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS technician_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(8, 2) NOT NULL,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    rating_average DECIMAL(3, 2) DEFAULT 5.00,
    jobs_completed INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR(36) PRIMARY KEY,
    buyer_id VARCHAR(36) NOT NULL,
    assigned_technician_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'APPROVED', 'CANCELLED', 'DISPUTED') DEFAULT 'DRAFT',
    budget_type ENUM('FIXED', 'HOURLY') NOT NULL,
    budget_amount DECIMAL(10, 2) NOT NULL,
    address_line TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    scheduled_start_time DATETIME NOT NULL,
    scheduled_end_time DATETIME NOT NULL,
    sla_expiration_time DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wo_status (status),
    INDEX idx_wo_schedule (scheduled_start_time),
    FOREIGN KEY (buyer_id) REFERENCES buyer_profiles(id),
    FOREIGN KEY (assigned_technician_id) REFERENCES technician_profiles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS work_order_bids (
    id VARCHAR(36) PRIMARY KEY,
    work_order_id VARCHAR(36) NOT NULL,
    technician_id VARCHAR(36) NOT NULL,
    bid_amount DECIMAL(10, 2) NOT NULL,
    counter_note TEXT,
    bid_status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES technician_profiles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS work_order_deliverables (
    id VARCHAR(36) PRIMARY KEY,
    work_order_id VARCHAR(36) NOT NULL,
    deliverable_type ENUM('PHOTO_BEFORE', 'PHOTO_AFTER', 'CHECKLIST', 'SIGNATURE') NOT NULL,
    s3_url VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS escrow_accounts (
    id VARCHAR(36) PRIMARY KEY,
    work_order_id VARCHAR(36) NOT NULL,
    amount_locked DECIMAL(10, 2) NOT NULL,
    status ENUM('HELD', 'RELEASED', 'REFUNDED', 'DISPUTED') DEFAULT 'HELD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;
