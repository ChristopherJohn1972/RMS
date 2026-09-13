-- =============================================
-- Rental Management System - Database Schema
-- MySQL / MariaDB compatible
-- Import this into MySQL Workbench
-- =============================================

CREATE DATABASE IF NOT EXISTS `rms_database`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `rms_database`;

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(128) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(128) NOT NULL,
  `last_name` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(32) DEFAULT NULL,
  `role` ENUM('admin','staff','tenant') NOT NULL DEFAULT 'tenant',
  `apartment` VARCHAR(128) DEFAULT NULL,
  `house_number` VARCHAR(64) DEFAULT NULL,
  `emergency_contact` VARCHAR(255) DEFAULT NULL,
  `move_in_date` VARCHAR(32) DEFAULT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB;

-- =============================================
-- PROPERTIES
-- =============================================
CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(512) NOT NULL,
  `city` VARCHAR(128) NOT NULL,
  `state` VARCHAR(128) DEFAULT NULL,
  `zip_code` VARCHAR(32) DEFAULT NULL,
  `type` ENUM('apartment','house','condo','townhouse') NOT NULL DEFAULT 'apartment',
  `total_units` INT NOT NULL DEFAULT 1,
  `year_built` INT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_properties_city` (`city`),
  INDEX `idx_properties_type` (`type`)
) ENGINE=InnoDB;

-- =============================================
-- UNITS
-- =============================================
CREATE TABLE IF NOT EXISTS `units` (
  `id` VARCHAR(128) NOT NULL,
  `property_id` VARCHAR(128) NOT NULL,
  `unit_number` VARCHAR(64) NOT NULL,
  `type` ENUM('apartment','house','condo','townhouse') NOT NULL DEFAULT 'apartment',
  `bedrooms` INT NOT NULL,
  `bathrooms` FLOAT NOT NULL,
  `square_feet` INT NOT NULL,
  `rent_amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('vacant','occupied','under_maintenance','reserved') NOT NULL DEFAULT 'vacant',
  `description` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_units_property` (`property_id`),
  INDEX `idx_units_status` (`status`),
  CONSTRAINT `fk_units_property` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- PROPERTY AMENITIES (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS `property_amenities` (
  `property_id` VARCHAR(128) NOT NULL,
  `amenity` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`property_id`, `amenity`),
  CONSTRAINT `fk_amenities_property` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- UNIT AMENITIES (many-to-many)
-- =============================================
CREATE TABLE IF NOT EXISTS `unit_amenities` (
  `unit_id` VARCHAR(128) NOT NULL,
  `amenity` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`unit_id`, `amenity`),
  CONSTRAINT `fk_unit_amenities_unit` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- LEASES
-- =============================================
CREATE TABLE IF NOT EXISTS `leases` (
  `id` VARCHAR(128) NOT NULL,
  `tenant_id` VARCHAR(128) NOT NULL,
  `unit_id` VARCHAR(128) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `rent_amount` DECIMAL(12,2) NOT NULL,
  `security_deposit` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `payment_due_day` INT NOT NULL DEFAULT 1,
  `late_fee` DECIMAL(12,2) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('active','expired','terminated') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_leases_tenant` (`tenant_id`),
  INDEX `idx_leases_unit` (`unit_id`),
  CONSTRAINT `fk_leases_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`uid`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_leases_unit` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- MAINTENANCE REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` VARCHAR(128) NOT NULL,
  `unit_id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(128) DEFAULT NULL,
  `issue` VARCHAR(512) NOT NULL,
  `description` TEXT NOT NULL,
  `urgency` ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `assigned_to` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_maintenance_unit` (`unit_id`),
  INDEX `idx_maintenance_user` (`user_id`),
  INDEX `idx_maintenance_status` (`status`),
  CONSTRAINT `fk_maintenance_unit` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_maintenance_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(128) NOT NULL,
  `tenant_id` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(64) NOT NULL,
  `reference` VARCHAR(255) NOT NULL,
  `status` ENUM('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
  `due_date` DATE DEFAULT NULL,
  `paid_at` DATETIME DEFAULT NULL,
  `description` VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_payments_tenant` (`tenant_id`),
  INDEX `idx_payments_status` (`status`),
  CONSTRAINT `fk_payments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`uid`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'info',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `link` VARCHAR(512) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notifications_user` (`user_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- SEED DATA
-- =============================================

-- Users
INSERT INTO `users` (`uid`, `email`, `first_name`, `last_name`, `phone`, `role`, `apartment`, `house_number`)
VALUES
  ('admin_001', 'admin@example.com', 'System', 'Admin', '+254700000000', 'admin', NULL, NULL),
  ('staff_001', 'staff@example.com', 'Staff', 'Member', '+254711111111', 'staff', NULL, NULL),
  ('tenant_001', 'tenant@example.com', 'John', 'Doe', '+254722222222', 'tenant', 'Unit 4B', '123'),
  ('tenant_002', 'jane@example.com', 'Jane', 'Smith', '+254733333333', 'tenant', 'Unit 2A', '456');

-- Properties
INSERT INTO `properties` (`id`, `name`, `address`, `city`, `state`, `zip_code`, `type`, `total_units`)
VALUES
  ('prop_001', 'Sunrise Apartments', '123 Main Street, Westlands', 'Nairobi', 'Nairobi', '00100', 'apartment', 10),
  ('prop_002', 'Green Valley Houses', '456 Riverside Drive, Karen', 'Nairobi', 'Nairobi', '00500', 'house', 4);

-- Property Amenities
INSERT INTO `property_amenities` (`property_id`, `amenity`)
VALUES
  ('prop_001', 'Swimming Pool'),
  ('prop_001', 'Gym'),
  ('prop_001', '24/7 Security'),
  ('prop_001', 'Parking'),
  ('prop_002', 'Garden'),
  ('prop_002', 'Parking (2 cars)'),
  ('prop_002', 'Security'),
  ('prop_002', 'Maid''s Quarters');

-- Units
INSERT INTO `units` (`id`, `property_id`, `unit_number`, `type`, `bedrooms`, `bathrooms`, `square_feet`, `rent_amount`, `status`)
VALUES
  ('unit_001', 'prop_001', '4B', 'apartment', 2, 1.5, 850, 35000.00, 'occupied'),
  ('unit_002', 'prop_001', '2A', 'apartment', 1, 1, 550, 22000.00, 'occupied'),
  ('unit_003', 'prop_001', '3C', 'apartment', 2, 2, 900, 38000.00, 'vacant'),
  ('unit_004', 'prop_002', 'H1', 'house', 4, 3, 2200, 85000.00, 'vacant');

-- Leases
INSERT INTO `leases` (`id`, `tenant_id`, `unit_id`, `start_date`, `end_date`, `rent_amount`, `security_deposit`, `payment_due_day`)
VALUES
  ('lease_001', 'tenant_001', 'unit_001', '2025-01-01', '2025-12-31', 35000.00, 70000.00, 1),
  ('lease_002', 'tenant_002', 'unit_002', '2025-03-01', '2026-02-28', 22000.00, 44000.00, 1);

-- Payments
INSERT INTO `payments` (`id`, `tenant_id`, `amount`, `payment_method`, `reference`, `status`, `paid_at`)
VALUES
  ('pay_001', 'tenant_001', 35000.00, 'mpesa', 'MPESA-001', 'paid', '2025-01-05 10:30:00'),
  ('pay_002', 'tenant_001', 35000.00, 'mpesa', 'MPESA-002', 'paid', '2025-02-04 14:20:00'),
  ('pay_003', 'tenant_002', 22000.00, 'bank_transfer', 'BANK-001', 'paid', '2025-03-05 09:00:00'),
  ('pay_004', 'tenant_002', 22000.00, 'bank_transfer', 'BANK-002', 'pending', NULL);

-- Maintenance Requests
INSERT INTO `maintenance_requests` (`id`, `unit_id`, `user_id`, `issue`, `description`, `urgency`, `status`)
VALUES
  ('maint_001', 'unit_001', 'tenant_001', 'Leaky faucet', 'Kitchen faucet drips constantly', 'medium', 'pending'),
  ('maint_002', 'unit_002', 'tenant_002', 'Broken window', 'Living room window won''t close', 'high', 'in_progress');
