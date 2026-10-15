FROM node:22

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --ignore-scripts

COPY . .

RUN DATABASE_URL="postgresql://dummy:5432/mydb" npx prisma generate

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
