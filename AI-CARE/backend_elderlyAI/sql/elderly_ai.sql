CREATE DATABASE IF NOT EXISTS ElderlyCareAI
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ElderlyCareAI;

DROP TABLE IF EXISTS MedicineSchedules;
DROP TABLE IF EXISTS MedicationHistory;
DROP TABLE IF EXISTS HealthRecords;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS FallHistory;
DROP TABLE IF EXISTS Medicines;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_code VARCHAR(50) UNIQUE,
    device_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    age INT,
    phone VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(100),
    height_cm INT,
    weight_kg INT,
    blood_group VARCHAR(10),
    allergy VARCHAR(255),
    caregiver_name VARCHAR(100),
    caregiver_phone VARCHAR(20),
    doctor_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_code VARCHAR(50) UNIQUE,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    quantity INT DEFAULT 0,
    instruction TEXT,
    start_date DATE,
    expire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE MedicineSchedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    user_id INT,
    scheduled_date DATE NOT NULL,
    take_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Chưa uống',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedule_medicine
        FOREIGN KEY(medicine_id)
        REFERENCES Medicines(medicine_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_schedule_user
        FOREIGN KEY(user_id)
        REFERENCES Users(user_id),

    CONSTRAINT chk_medicine_schedule_status
        CHECK(status IN ('Đã uống', 'Chưa uống', 'Quên uống'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE HealthRecords (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recorded_at DATETIME,
    blood_pressure VARCHAR(20),
    heart_rate INT,
    spo2 INT,
    body_temperature FLOAT,
    blood_glucose INT,
    disease VARCHAR(100),
    fall_history VARCHAR(20),
    fall_risk_score INT,
    risk_level VARCHAR(50),
    adherence_rate INT,
    ai_prediction VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_health_record_user
        FOREIGN KEY(user_id)
        REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200),
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY(user_id)
        REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE FallHistory (
    fall_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    location VARCHAR(255),
    severity VARCHAR(50),
    image VARCHAR(255),
    fall_time DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fall_user
        FOREIGN KEY(user_id)
        REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Users(full_name, gender, phone, address)
VALUES
('Nguyen Van A', 'Male', '0900000001', 'Ha Noi'),
('Tran Thi B', 'Female', '0900000002', 'Ha Noi'),
('Le Van C', 'Male', '0900000003', 'Hai Phong');

INSERT INTO Medicines
(medicine_code, medicine_name, dosage, frequency, quantity, instruction, start_date, expire_date)
VALUES
('MED_SAMPLE_001', 'Paracetamol', '500mg', '2/day', 120, 'After meal', '2026-07-01', '2027-12-31'),
('MED_SAMPLE_002', 'Vitamin C', '1000mg', '1/day', 80, 'Morning', '2026-07-01', '2028-01-01'),
('MED_SAMPLE_003', 'Panadol', '500mg', '3/day', 6, 'After meal', '2026-06-01', '2026-05-01'),
('MED_SAMPLE_004', 'Amoxicillin', '500mg', '3/day', 45, 'After meal', '2026-07-10', '2027-06-15'),
('MED_SAMPLE_005', 'Omega 3', '1000mg', '1/day', 9, 'After breakfast', '2026-07-01', '2028-08-01');

INSERT INTO MedicineSchedules
(medicine_id, user_id, scheduled_date, take_time, status, note)
VALUES
(1, 1, '2026-07-14', '08:00:00', 'Đã uống', 'Morning dose'),
(1, 1, '2026-07-14', '20:00:00', 'Chưa uống', 'Evening dose'),
(2, 1, '2026-07-14', '07:30:00', 'Đã uống', 'After breakfast'),
(3, 2, '2026-07-14', '12:00:00', 'Quên uống', 'Forgot lunch dose'),
(4, 3, '2026-07-14', '08:00:00', 'Chưa uống', 'After meal');

INSERT INTO HealthRecords
(user_id, recorded_at, blood_pressure, heart_rate, spo2, body_temperature,
 blood_glucose, disease, fall_history, fall_risk_score, risk_level,
 adherence_rate, ai_prediction)
VALUES
(1, '2026-07-14 08:00:00', '120/80', 76, 98, 36.8, 95, 'Tăng huyết áp', 'Không', 20, 'Thấp', 92, 'Ổn định'),
(2, '2026-07-14 09:00:00', '135/85', 82, 97, 37.1, 120, 'Viêm khớp', 'Có', 72, 'Cao', 78, 'Nguy cơ té ngã');

INSERT INTO Notifications
(user_id, title, content)
VALUES
(1, 'Medicine Reminder', 'Take your medicine'),
(2, 'Health Reminder', 'Drink enough water');

INSERT INTO FallHistory
(user_id, location, severity)
VALUES
(1, 'Bedroom', 'Low'),
(2, 'Kitchen', 'Medium');
