import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("roles", ["student", "mentor", "admin"]);

export const UserTable = pgTable(
  "user",
  {
    id: uuid("id").defaultRandom().primaryKey(), // Auto-generates UUID
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    profileImageUrl: varchar("profile_image_url", { length: 1024 }),
    userRole: userRoleEnum("roles").notNull().default("student"),
    passwordChangedAt: timestamp("password_changed_at"),
    emailVerificationToken: varchar("email_verification_token", {
      length: 255,
    }),
    emailVerificationExpires: timestamp("email_verification_expires"),
    isEmailVerified: boolean("is_email_verified").default(false), // Fixed snake_case
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex("email_index").on(table.email), // Fixed typo
    };
  }
);
