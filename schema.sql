CREATE TABLE IF NOT EXISTS process_records (
    id VARCHAR(80) PRIMARY KEY,
    record_data JSON NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_process_records_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;