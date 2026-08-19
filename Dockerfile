# Môi trng sử dụng Node.js phiên bản 22
FROM node:22

# Tạo thư mục làm việc trong container
WORKDIR /app

# Cài đặt pnpm thông qua corepack
 RUN corepack enable

# Sao chép file package.json và pnpm-lock.yaml vào thư mục làm việc để cài đặt thư viện trước
COPY package.json pnpm-lock.yaml ./

# Cài đặt các thư viện
RUN pnpm install --ignore-scripts

# Sao chép toàn bộ mã nguồn vào thư mục làm việc trong container
COPY . .

# Chạy Prisma Generate để tạo Client
RUN DATABASE_URL="postgresql://dummy:5432/mydb" npx prisma generate

# Expose cổng 3000 (Next.js mặc định)
EXPOSE 3000

# Lệnh chạy mặc định
CMD ["pnpm", "run", "dev"]

