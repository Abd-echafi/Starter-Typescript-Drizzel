import dotenv from "dotenv";
dotenv.config();
import { Request, Response, NextFunction } from "express";
import { db } from "../drizzle/db";
import { UserTable } from "../drizzle/schema";
import AppError from "../utils/AppError";
import { signupSchema } from "../utils/zod.schemas";
import {
  sendVerificationEmail,
  generateVerificationToken,
} from "../utils/email";
import {
  createSendToken,
  correctPassword,
  changedPasswordAfter,
} from "../utils/auth.helpers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  eq,
  and,
  or,
  like,
  gt,
  lt,
  gte,
  lte,
  ne,
  inArray,
  isNull,
  isNotNull,
  sql,
} from "drizzle-orm";
//signup Controller
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Validate input data with Zod
    const validatedData = signupSchema.parse(req.body);

    // Step 2: Check if user already exists
    const existingUser = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, validatedData.email));

    if (existingUser.length > 0) {
      return next(new AppError("User with this email already exists", 409));
    }

    // Step 3: Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      saltRounds
    );

    // Step 4: Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Step 5: Create user in database
    const newUser = await db
      .insert(UserTable)
      .values({
        fullName: validatedData.fullName,
        email: validatedData.email,
        password: hashedPassword,
        userRole: validatedData.userRole || "student",
        profileImageUrl: validatedData.profileImageUrl,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationTokenExpires,
        isEmailVerified: false,
      })
      .returning();

    if (!newUser.length) {
      next(new AppError("Failed to create user", 500));
      return;
    }

    const user = newUser[0];

    // Step 6: Send verification email
    try {
      await sendVerificationEmail(user.email, user.fullName, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      await db.delete(UserTable).where(eq(UserTable.id, user.id));
      next(
        new AppError(
          "Failed to send verification email. Please try again.",
          500
        )
      );
      return;
    }

    // Step 7: Send response
    const { password, emailVerificationToken, ...userResponse } = user;

    res.status(201).json({
      status: "success",
      message:
        "Account created successfully! Please check your email to verify your account.",
      data: {
        user: userResponse,
        emailSent: true,
      },
    });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: validationErrors,
      });
    }
    next(error);
  }
};

//controller for email verification
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    console.log("token: ", req.params.token);
    if (!token) {
      return next(new AppError("Verification token is required", 400));
    }

    // Find user with valid verification token
    const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.emailVerificationToken, token));

    if (!user.length) {
      return next(new AppError("Invalid or expired verification token", 400));
    }

    const foundUser = user[0];

    // Check if token is expired
    if (
      foundUser.emailVerificationExpires &&
      new Date() > foundUser.emailVerificationExpires
    ) {
      return next(new AppError("Verification token has expired", 400));
    }

    // Update user as verified
    const updatedUser = await db
      .update(UserTable)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(UserTable.id, foundUser.id))
      .returning();

    // Log the user in after verification
    createSendToken(updatedUser[0], 200, res);
  } catch (error) {
    next(error);
  }
};

//login controller
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Check email and password
    if (!email || !password) {
      throw new AppError("Please provide email and password", 400);
    }
    // Find user and include password field
    const userArray = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));
    const user = userArray[0];
    // Verify user and password
    if (!user || !(await correctPassword(password, user.password))) {
      throw new AppError("Invalid email or password", 400); // More specific error message
    }

    // Send token to user
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("entered");
    // Get token from header
    const token = req.cookies.jwt;
    console.log(token);
    // Check token presence
    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // Verify token

    interface JwtPayloadWithId extends jwt.JwtPayload {
      id: string;
    }
    let decoded: JwtPayloadWithId;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayloadWithId;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError(
          "Your session has expired. Please log in again.",
          401
        );
      }
      throw new AppError("Invalid token. Please log in again.", 401);
    }
    // Find user by decoded ID
    const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, decoded.id));
    const freshUser = user[0];
    if (!freshUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // Check if user changed password
    if (!decoded.iat) {
      throw new AppError("Invalid token: missing issued date.", 401);
    }
    const issuedDate = new Date(decoded.iat * 1000);
    if (changedPasswordAfter(freshUser.passwordChangedAt, issuedDate)) {
      return next(
        new AppError(
          "User recently changed password. Please log in again.",
          401
        )
      );
    }

    // Attach user to request
    req.user = freshUser;
    next();
  } catch (error) {
    next(error);
  }
};

// restrict to function
export const restrictTo =
  (...roles: [string]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        if (!roles.includes(req.user.userRole)) {
          return next(
            new AppError(
              "You do not have permission to perform this action",
              403
            )
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
