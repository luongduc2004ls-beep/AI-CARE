-- ==============================================================================
-- ELDERLYCARE AI - DATABASE SCHEMA (SCHEMA.SQL)
-- Hệ thống Quản Lý & Chăm Sóc Người Cao Tuổi
-- ==============================================================================

CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'User',
    patient_code VARCHAR(50),
    phone VARCHAR(20),
    address VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    allergy VARCHAR(255),
    doctor_name VARCHAR(150),
    caregiver_name VARCHAR(150),
    caregiver_phone VARCHAR(20),
    caregiver_relation VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Medicines (
    medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100),
    form VARCHAR(50),
    frequency VARCHAR(100),
    instruction TEXT,
    unit VARCHAR(50),
    stock_quantity INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Prescriptions (
    prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_code VARCHAR(100) UNIQUE,
    user_id INTEGER NOT NULL,
    doctor_name VARCHAR(150),
    diagnosis TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Đang điều trị',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PrescriptionItems (
    prescription_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_id INTEGER NOT NULL,
    medicine_id INTEGER,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    instruction TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES Prescriptions(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS MedicineSchedules (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prescription_item_id INTEGER,
    medicine_id INTEGER,
    user_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    take_time TIME NOT NULL,
    dose_amount VARCHAR(50) DEFAULT '1 viên',
    status VARCHAR(20) DEFAULT 'Chưa uống',
    taken_at DATETIME,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HealthRecords (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    blood_pressure VARCHAR(50),
    heart_rate INTEGER,
    spo2 INTEGER,
    body_temperature FLOAT,
    blood_glucose FLOAT,
    risk_level VARCHAR(50) DEFAULT 'Thấp',
    ai_prediction VARCHAR(100) DEFAULT 'Ổn định',
    fall_history VARCHAR(100) DEFAULT 'Không',
    note TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'ALERTED',
    location VARCHAR(150),
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Cameras (
    camera_id INTEGER PRIMARY KEY AUTOINCREMENT,
    camera_name VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    patient_id VARCHAR(50),
    stream_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ONLINE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FallHistory (
    fall_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fall_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(150),
    severity VARCHAR(50) DEFAULT 'Cao',
    status VARCHAR(50) DEFAULT 'Đã ghi nhận',
    note TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'HEALTH_ALERT',
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role_scope VARCHAR(50) DEFAULT 'PATIENT',
    patient_id VARCHAR(50),
    title VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    structured_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);
