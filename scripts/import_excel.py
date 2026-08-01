import pandas as pd
from sqlalchemy import create_engine

# ==========================
# Cấu hình MySQL
# ==========================

USERNAME = "root"
PASSWORD = "ai%402026"
HOST = "localhost"
DATABASE = "ai_care"

engine = create_engine(
    f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}/{DATABASE}"
)

# ==========================
# Đường dẫn file Excel
# ==========================

from pathlib import Path

# Thư mục backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Đường dẫn tới file Excel
excel_file = BASE_DIR / "data" / "AI_CARE_Database.xlsx"

print("Đường dẫn:", excel_file)
print("Tồn tại:", excel_file.exists())

# ==========================
# Đọc tất cả Sheet
# ==========================

excel = pd.ExcelFile(excel_file)

print("Các sheet tìm thấy:")

print(excel.sheet_names)

# ==========================
# Import từng Sheet
# ==========================

for sheet in excel.sheet_names:

    print(f"Đang import: {sheet}")

    df = pd.read_excel(
        excel_file,
        sheet_name=sheet
    )

    table_name = sheet.lower()

    df.to_sql(

        table_name,

        con=engine,

        if_exists="replace",

        index=False

    )

    print(f"Hoàn thành: {table_name}")

print("Import thành công.")