# Elderly AI Backend

Backend s? d?ng Flask + SQLAlchemy + MySQL.

---

## C?i th? vi?n

```bash
pip install -r requirements.txt
```

---

## T?o Database

M? MySQL Workbench v? import:

```text
sql/elderly_ai.sql
```

N?u ?ang c? database c?, ch?y migration m?t l?n:

```text
sql/migrate_medicine_schedule.sql
sql/migrate_ai_care_database.sql
```

---

## C?u h?nh

T?o file `.env` t? `.env.example` v? ?i?n m?t kh?u MySQL:

```env
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_NAME=ElderlyCareAI
BACKEND_HOST=localhost
BACKEND_PORT=5000
```

---

## Import AI CARE Database

File ngu?n:

```text
C:\Users\AD\OneDrive\Documents\AI_CARE_Database.xlsx
```

Ch?y import:

```bash
python scripts/import_ai_care_dataset.py
```

C? th? truy?n ???ng d?n kh?c n?u c?n:

```bash
python scripts/import_ai_care_dataset.py "C:\Users\AD\OneDrive\Documents\AI_CARE_Database.xlsx"
```

Importer s? ??a d? li?u v?o c?c b?ng ch?nh:

- `Users`: b?nh nh?n, thi?t b?, ng??i ch?m s?c, b?c s?, th?ng tin c? b?n.
- `Medicines`: danh m?c thu?c theo `medicine_code` t? Excel.
- `MedicineSchedules`: l?ch u?ng thu?c theo t?ng b?nh nh?n.
- `HealthRecords`: ch? s? s?c kh?e, nguy c? t? ng?, adherence rate, d? ?o?n AI.
- `Notifications`: th?ng b?o v? tr?ng th?i x?c nh?n.
- `FallHistory`: l?ch s? t? ng? l?y t? h? s? s?c kh?e.

---

## Ch?y Backend

```bash
python app.py
```

C?n ch?y backend ? terminal ri?ng v?i frontend. Frontend Vite d?ng port `5173`, backend Flask d?ng port `5000`.

Server:

```text
http://localhost:5000
```

Frontend Vite dev server:

```text
http://localhost:5173
```

---

# Medicine API

GET /medicines

GET /medicines/<id>

POST /medicines

PUT /medicines/<id>

PATCH /medicines/<id>/status

DELETE /medicines/<id>

GET /medicines/search

GET /medicines/expired

GET /medicines/low-stock

---

# Medicine Schedule API

GET /medicine-schedules

GET /medicine-schedules?medicine_id=1

GET /medicine-schedules?user_id=1

GET /medicine-schedules?scheduled_date=2026-07-14

GET /medicine-schedules?status=Ch?a u?ng

GET /medicine-schedules/<id>

GET /medicines/<id>/schedules

POST /medicine-schedules

PUT /medicine-schedules/<id>

PATCH /medicine-schedules/<id>/status

DELETE /medicine-schedules/<id>

---

# Dashboard API

GET /dashboard

GET /dashboard/chart

GET /dashboard/charts

GET /dashboard/charts/bar

GET /dashboard/charts/pie

GET /dashboard/charts/line

GET /dashboard/statistics
