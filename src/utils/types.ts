import { UserTable } from "../drizzle/schema"; // Import your User type
import type { InferSelectModel } from "drizzle-orm";

type User = InferSelectModel<typeof UserTable>;
declare global {
  namespace Express {
    interface Request {
      user?: User; // Make it optional since it won't exist before the middleware
    }
  }
}
