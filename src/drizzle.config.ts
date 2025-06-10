import dotenv from "dotenv";
dotenv.config();
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/drizzle/migration",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    ssl: process.env.DB_SSL === "true" ? true : false,
  },
  verbose: true,
  strict: true,
});
