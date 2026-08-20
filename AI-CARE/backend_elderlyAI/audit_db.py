import sqlite3
import json
import sys
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'elderly_ai.db')
print(f"Auditing Database at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
table_names = [t[0] for t in tables if not t[0].startswith('sqlite_')]
print('All Tables in SQLite:', table_names)

for t in table_names:
    schema = cursor.execute(f"PRAGMA table_info({t});").fetchall()
    fks = cursor.execute(f"PRAGMA foreign_key_list({t});").fetchall()
    count = cursor.execute(f"SELECT COUNT(*) FROM {t};").fetchone()[0]
    print(f"\n=== TABLE {t} ({count} rows) ===")
    for col in schema:
        print(f"  Col: {col[1]} ({col[2]}), PK={col[5]}, Nullable={not col[3]}")
    if fks:
        print(f"  Foreign Keys: {fks}")

print("\n--- SAMPLE MEDICINE SCHEDULES ---")
schedules = cursor.execute("SELECT * FROM MedicineSchedules LIMIT 5;").fetchall()
for s in schedules:
    print(" ", s)

print("\n--- SAMPLE MEDICINES ---")
medicines = cursor.execute("SELECT * FROM Medicines LIMIT 5;").fetchall()
for m in medicines:
    print(" ", m)

print("\n--- CHECKING USERS WITH MEDICINE SCHEDULES ---")
user_sched_counts = cursor.execute("""
    SELECT u.user_id, u.patient_code, u.full_name, COUNT(ms.schedule_id) 
    FROM Users u 
    LEFT JOIN MedicineSchedules ms ON u.user_id = ms.user_id 
    GROUP BY u.user_id 
    HAVING COUNT(ms.schedule_id) > 0 
    LIMIT 10;
""").fetchall()
for row in user_sched_counts:
    print(" ", row)
