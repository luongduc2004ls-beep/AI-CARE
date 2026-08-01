USE ElderlyCareAI;

ALTER DATABASE ElderlyCareAI
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS patient_code VARCHAR(50) NULL AFTER user_id,
    ADD COLUMN IF NOT EXISTS device_id VARCHAR(50) NULL AFTER patient_code,
    ADD COLUMN IF NOT EXISTS age INT NULL AFTER date_of_birth,
    ADD COLUMN IF NOT EXISTS height_cm INT NULL AFTER emergency_contact,
    ADD COLUMN IF NOT EXISTS weight_kg INT NULL AFTER height_cm,
    ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) NULL AFTER weight_kg,
    ADD COLUMN IF NOT EXISTS allergy VARCHAR(255) NULL AFTER blood_group,
    ADD COLUMN IF NOT EXISTS caregiver_name VARCHAR(100) NULL AFTER allergy,
    ADD COLUMN IF NOT EXISTS caregiver_phone VARCHAR(20) NULL AFTER caregiver_name,
    ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(100) NULL AFTER caregiver_phone,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE Medicines
    ADD COLUMN IF NOT EXISTS medicine_code VARCHAR(50) NULL AFTER medicine_id;

ALTER TABLE MedicineSchedules
    ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER medicine_id;

CREATE TABLE IF NOT EXISTS HealthRecords (
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
