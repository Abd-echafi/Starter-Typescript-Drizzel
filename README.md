# 🚀 Starter TypeScript + Express + Drizzle ORM

A clean and scalable starter project using **Node.js**, **Express**, **TypeScript**, and **Drizzle ORM** — with built-in **authentication**, **authorization middleware**, and **user login/signup** functionality.

---

## ✅ Features

- 🟦 TypeScript-first backend boilerplate
- 📦 Express.js server setup
- 🐘 PostgreSQL + Drizzle ORM
- 🔒 Authentication with JWT (Login & Signup)
- ✅ Role-based Authorization middleware
- 🧱 Modular structure with scalable folders
- 🌱 Environment variable support using `.env`

---

## 🧰 Tech Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **Env config**: dotenv

---
## ⚙️ Installation & Setup

### 1. Clone the Repository

git clone https://github.com/Abd-echafi/Starter-Typescript-Drizzel.git
cd Starter-Typescript-Drizzel

### 2. Install Dependencies

npm install

### 3. Generate Drizzle Migration

npm run db:generate

### 4. Apply the Migration

npm run db:migrate

### 5. Start the Development Server

npm run dev

---

🔐 Authentication
Signup
POST /api/auth/signup
Register a new user with name, email, and password

Login
POST /api/auth/login
Log in and receive a JWT token


---

🔒 Authorization Middleware
You can protect routes using:

Auth Middleware: verifies the JWT token

Role Middleware: restrict access based on user roles (e.g., admin vs user)


---

👤 Author
Abd-echafi
🎓 3rd-year Computer Engineering Student
💻 Node.js & TypeScript Backend Developer
🔗 GitHub: https://github.com/Abd-echafi
