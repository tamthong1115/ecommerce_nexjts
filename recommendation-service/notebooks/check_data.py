import os
from src import load_products_from_db,  prepare_data


def inspect_data():
    # 1. Load từ DB
    print("1️⃣ Đang lấy dữ liệu từ DB...")
    df = load_products_from_db()

    if df.empty:
        print("❌ DB trống trơn! Hãy vào Prisma Studio tạo vài sản phẩm test đi.")
        return

    # 2. Xuất ra file raw để xem
    raw_path = 'data/raw/products_raw.csv'
    os.makedirs('data/raw', exist_ok=True)
    df.to_csv(raw_path, index=False, encoding='utf-8')
    print(f"✅ Đã xuất file thô: {raw_path}")
    print("-" * 50)
    print("👀 5 Dòng đầu tiên (Raw):")
    print(df[['title', 'category_name', 'keywords']].head())

    # 3. Test thử bước làm sạch (Preprocessing)
    print("\n2️⃣ Test thử bước gộp dữ liệu (Soup)...")
    df_clean = prepare_data(df)

    soup_example = df_clean['content_soup'].iloc[0]
    print(f"👉 Ví dụ dòng 1 sau khi gộp (Model sẽ đọc cái này):")
    print(f"   [{soup_example}]")

    # 4. Kiểm tra độ dài
    print("-" * 50)
    print(f"📊 Tổng số sản phẩm dùng để so sánh: {len(df)}")
    if len(df) < 5:
        print("⚠️ CẢNH BÁO: Dữ liệu quá ít (<5). Gợi ý sẽ không chính xác.")
    else:
        print("✅ Số lượng ổn để test.")


if __name__ == "__main__":
    inspect_data()