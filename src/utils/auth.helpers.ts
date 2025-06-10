import dotenv from "dotenv";
dotenv.config();
import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../drizzle/db";
import { UserTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
//fucntion to compare the password entered from the user with the hashed password in the db
export const correctPassword = async (
  candidatePassword: string,
  dbPasword: string
) => {
  return await bcrypt.compare(candidatePassword, dbPasword);
};

//function to check if the password changed after
/**
 * Compares a plain text password with a hashed password
 * @param candidatePassword - Plain text password from user input
 * @param dbPassword - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 */
export const changedPasswordAfter = (
  passwordChangedAt: Date | null,
  JWTTimestamp: Date
): boolean => {
  if (passwordChangedAt) {
    const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);
    const jwtTimestamp = Math.floor(JWTTimestamp.getTime() / 1000);
    return jwtTimestamp < changedTimestamp;
  }

  // Password not changed after token issued
  return false;
};

// fucntion that updates the passwordChangedAt field
export const updatePasswordChangedAt = async (userId: string) => {
  await db
    .update(UserTable)
    .set({
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(UserTable.id, userId));
};

// fucntion that sign Token
export const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });

// Send Token Response

// Define the user type based on UserTbale schema
type UserResponse = typeof UserTable.$inferSelect;

export const createSendToken = (
  user: UserResponse,
  statusCode: number,
  res: Response
): void => {
  const token = signToken(user.id);

  // Exclude password from response
  const { password, ...userWithoutPassword } = user;

  // Send token via secure cookie
  const cookieExpiresIn = parseInt(
    process.env.JWT_COOKIE_EXPIRES_IN || "7",
    10
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000),
  });

  // JSON response
  res.status(statusCode).json({
    status: "success",
    data: userWithoutPassword,
  });
};
