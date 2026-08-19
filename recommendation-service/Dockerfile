FROM python:3.13-slim

# Tạo thư mục làm việc trong container
WORKDIR /app

# Sao chép file requirements.txt vào thư mục làm việc để cài đặt thư viện trước
COPY requirements.txt .

# Cài đặt các thư viện
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn vào thư mục làm việc trong container
COPY . .

# Chạy server trên port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]