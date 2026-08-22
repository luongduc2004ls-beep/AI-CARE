-- ==============================================================================
-- ELDERLYCARE AI - SEED DEMO CLINICAL & MANAGEMENT DATA (SEED.SQL / DEMO.SQL)
-- ==============================================================================

-- 1. Users (Mật khẩu mặc định: 'password123')
INSERT INTO Users (user_id, username, password_hash, full_name, role, patient_code, phone, address, age, gender, blood_group, allergy, doctor_name, caregiver_name, caregiver_phone, caregiver_relation, is_active)
VALUES 
(1001, 'admin1', 'scrypt:32768:8:1$uH34J4q7Hl8R2y6z$a15e610d0a51c4be8eecfb2d35ba48b940989f67ae5848bb377484dfc7457fcbe7cbcfb6982eb4b23ce5b1fe50d4ad6da8a1bbab5b706c4b2ff54cbb29b0be99', 'BS. Nguyễn Văn Hùng', 'Admin', NULL, '0912345678', 'BV Lão Khoa TW', 48, 'Nam', 'O+', 'Không có', 'BS. Nguyễn Văn Hùng', NULL, NULL, NULL, 1),
(1002, 'admin', 'scrypt:32768:8:1$uH34J4q7Hl8R2y6z$a15e610d0a51c4be8eecfb2d35ba48b940989f67ae5848bb377484dfc7457fcbe7cbcfb6982eb4b23ce5b1fe50d4ad6da8a1bbab5b706c4b2ff54cbb29b0be99', 'Quản Trị Viên Hệ Thống', 'Admin', NULL, '0987654321', 'ElderlyCare Hub', 35, 'Nam', 'A+', 'Không có', NULL, NULL, NULL, NULL, 1),
(1, 'user_pat10000', 'scrypt:32768:8:1$uH34J4q7Hl8R2y6z$a15e610d0a51c4be8eecfb2d35ba48b940989f67ae5848bb377484dfc7457fcbe7cbcfb6982eb4b23ce5b1fe50d4ad6da8a1bbab5b706c4b2ff54cbb29b0be99', 'Hồ Thanh Khánh', 'User', 'PAT10000', '0901234000', 'Phòng 101, Tòa A', 71, 'Nam', 'O+', 'Phấn hoa', 'BS. Nguyễn Văn Hùng', 'Nguyễn Thị Mai', '0909111222', 'Vợ', 1),
(2, 'user_pat10001', 'scrypt:32768:8:1$uH34J4q7Hl8R2y6z$a15e610d0a51c4be8eecfb2d35ba48b940989f67ae5848bb377484dfc7457fcbe7cbcfb6982eb4b23ce5b1fe50d4ad6da8a1bbab5b706c4b2ff54cbb29b0be99', 'Phan Anh Thảo', 'User', 'PAT10001', '0901234001', 'Phòng 102, Tòa A', 68, 'Nữ', 'A+', 'Penicillin', 'BS. Nguyễn Văn Hùng', 'Phan Quốc Tuấn', '0909111223', 'Con trai', 1),
(3, 'user_pat10002', 'scrypt:32768:8:1$uH34J4q7Hl8R2y6z$a15e610d0a51c4be8eecfb2d35ba48b940989f67ae5848bb377484dfc7457fcbe7cbcfb6982eb4b23ce5b1fe50d4ad6da8a1bbab5b706c4b2ff54cbb29b0be99', 'Trần Văn Bình', 'User', 'PAT10002', '0901234002', 'Phòng 103, Tòa A', 75, 'Nam', 'B+', 'Hải sản', 'BS. Nguyễn Văn Hùng', 'Trần Văn An', '0909111224', 'Con trai', 1);

-- 2. Master Medicines
INSERT INTO Medicines (medicine_id, medicine_name, dosage, form, frequency, instruction, unit, stock_quantity)
VALUES 
(1, 'Amlodipine', '5mg', 'Viên nén', '1 lần/ngày (Sáng sau ăn)', 'Uống cùng 200ml nước ấm', 'Viên', 500),
(2, 'Atorvastatin', '10mg', 'Viên bao phim', '1 lần/ngày (Tối trước khi ngủ)', 'Uống nguyên viên trước khi đi ngủ', 'Viên', 300),
(3, 'Omeprazole', '20mg', 'Viên nang', '1 lần/ngày (Sáng trước ăn 30p)', 'Uống trước bữa ăn sáng 30 phút', 'Viên', 450),
(4, 'Metformin', '500mg', 'Viên nén', '2 lần/ngày (Sáng, Tối)', 'Uống ngay trong hoặc sau bữa ăn', 'Viên', 400),
(5, 'Losartan', '50mg', 'Viên nén', '1 lần/ngày (Sáng)', 'Uống vào buổi sáng', 'Viên', 350);

-- 3. Prescriptions
INSERT INTO Prescriptions (prescription_id, prescription_code, user_id, doctor_name, diagnosis, start_date, end_date, status)
VALUES 
(1, 'RX_DEMO_01', 1, 'BS. Nguyễn Văn Hùng', 'Tăng huyết áp vô căn, Rối loạn lipid máu', '2026-01-01', '2026-12-31', 'Đang điều trị'),
(2, 'RX_DEMO_02', 2, 'BS. Nguyễn Văn Hùng', 'Viêm loét dạ dày tá tràng, Tăng huyết áp nhẹ', '2026-01-01', '2026-12-31', 'Đang điều trị');

-- 4. Prescription Items
INSERT INTO PrescriptionItems (prescription_item_id, prescription_id, medicine_id, medicine_name, dosage, frequency, instruction)
VALUES 
(1, 1, 1, 'Amlodipine', '5mg', '1 lần/ngày', 'Uống sau ăn sáng'),
(2, 1, 2, 'Atorvastatin', '10mg', '1 lần/ngày', 'Uống trước khi đi ngủ'),
(3, 2, 1, 'Amlodipine', '10mg', '1 lần/ngày', 'Uống sau ăn sáng'),
(4, 2, 3, 'Omeprazole', '20mg', '1 lần/ngày', 'Uống trước ăn sáng 30 phút');

-- 5. Medicine Schedules
INSERT INTO MedicineSchedules (schedule_id, prescription_item_id, medicine_id, user_id, scheduled_date, take_time, dose_amount, status, note)
VALUES 
(1, 1, 1, 1, CURRENT_DATE, '08:00:00', '1 viên', 'Đã uống', 'Uống sau ăn sáng'),
(2, 2, 2, 1, CURRENT_DATE, '20:00:00', '1 viên', 'Chưa uống', 'Uống trước khi ngủ'),
(3, 3, 1, 2, CURRENT_DATE, '08:00:00', '1 viên', 'Chưa uống', 'Uống sau ăn sáng'),
(4, 4, 3, 2, CURRENT_DATE, '07:30:00', '1 viên', 'Đã uống', 'Uống trước ăn sáng');

-- 6. Health Records
INSERT INTO HealthRecords (record_id, user_id, blood_pressure, heart_rate, spo2, body_temperature, blood_glucose, risk_level, ai_prediction, fall_history)
VALUES 
(1, 1, '135/85', 75, 97, 36.8, 6.2, 'Cao', 'Ổn định', 'Có lịch sử té ngã tại phòng ngủ'),
(2, 2, '120/80', 72, 98, 36.7, 5.5, 'Thấp', 'Ổn định', 'Không'),
(3, 3, '145/90', 82, 95, 37.0, 7.1, 'Cao', 'Cần theo dõi', 'Có lịch sử té ngã');

-- 7. Cameras
INSERT INTO Cameras (camera_id, camera_name, location, patient_id, stream_url, status)
VALUES 
(1, 'Camera Phòng 101', 'Phòng 101 - Khu A', 'PAT10000', 'http://127.0.0.1:5000/api/cameras/1/stream', 'ONLINE'),
(2, 'Camera Phòng 102', 'Phòng 102 - Khu A', 'PAT10001', 'http://127.0.0.1:5000/api/cameras/2/stream', 'ONLINE'),
(3, 'Camera Phòng 103', 'Phòng 103 - Khu A', 'PAT10002', 'http://127.0.0.1:5000/api/cameras/3/stream', 'ONLINE'),
(4, 'Camera Phòng 104', 'Phòng 104 - Khu A', 'PAT10003', 'http://127.0.0.1:5000/api/cameras/4/stream', 'OFFLINE');

-- 8. Alerts
INSERT INTO Alerts (alert_id, patient_id, title, description, severity, status, location)
VALUES 
(1, 'PAT10000', 'Cảnh báo nguy cơ té ngã cao khi rời giường', 'Phát hiện cử động mất thăng bằng', 'High', 'ALERTED', 'Phòng 101'),
(2, 'PAT10002', 'Cảnh báo huyết áp tâm thu cao (145/90 mmHg)', 'Đo sinh hiệu bất thường', 'Medium', 'ALERTED', 'Phòng 103');
