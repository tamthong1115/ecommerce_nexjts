# 🛒 E-Commerce Next.js Platform

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

A modern, multilingual multi-vendor e-commerce application built with **Next.js (App Router)**. This project features comprehensive role management (Admin, Seller, Customer), real-time functionality, and AI-powered image search.

---

# Images of the website
![Home Page](public/readme/home.png)

## ✨ Key Features

* **🤖 AI-Powered Search:** Image analysis and product search using Google GenAI.
* **🌍 Multilingual Support:** Built-in internationalization for global access.
* **🔐 Advanced Authentication:** Secure auth flows with email verification and password reset.
* **👥 Multi-Role System:** Dedicated dashboards for **Admins**, **Sellers**, and **Customers**.
* **📦 Order Management:** Full checkout flow, voucher system, and order tracking.
* **⚡ Real-time Updates:** Powered by **Pusher** for instant notifications.
* **🚀 Performance:** Redis caching and Cloudinary image optimization.

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router) |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL, Prisma ORM |
| **Caching** | Redis |
| **Real-time** | Pusher |
| **Storage** | Cloudinary |
| **Email** | Resend |
| **AI** | Google GenAI |

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
* **Node.js** (v22 or higher)
* **pnpm** (Recommended package manager)
* A running **PostgreSQL** instance

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <your-project-folder>
````
### 2. Install Dependencies
Bash

```pnpm install```

### 3. Configure Environment Variables
```bash
Create a .env file in the root directory. You must configure the keys validated in lib/env.ts:
```

### 4. Run the Development Server

```pnpm dev```


## Project Structure
### Read project structure of this project at [here](docs/PROJECT_STRUCTURE.md)