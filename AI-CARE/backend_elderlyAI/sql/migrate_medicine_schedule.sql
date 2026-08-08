USE ElderlyCareAI;

ALTER DATABASE ElderlyCareAI
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

ALTER TABLE Medicines
    CONVERT TO CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

ALTER TABLE Medicines
    ADD COLUMN start_date DATE NULL AFTER instruction;

ALTER TABLE Medicines
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE TABLE IF NOT EXISTS MedicineSchedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
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

    CONSTRAINT chk_medicine_schedule_status
        CHECK(status IN ('Đã uống', 'Chưa uống', 'Quên uống'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO MedicineSchedules
(medicine_id, scheduled_date, take_time, status, note)
SELECT
    medicine_id,
    DATE(taken_time),
    TIME(taken_time),
    CASE
        WHEN status = 'Taken' THEN 'Đã uống'
        WHEN status = 'Missed' THEN 'Quên uống'
        ELSE 'Chưa uống'
    END,
    note
FROM MedicationHistory;

DROP TABLE IF EXISTS MedicationHistory;
