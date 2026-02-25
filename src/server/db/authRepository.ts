import { and, eq } from "drizzle-orm";
import { db } from "./drizzle";
import { passwordResets, refreshTokens, users } from "./schema";

export interface RegisterUserInput {
  email: string;
  passwordHash: string;
  name?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: {
    email: string;
    name: string | null;
  };
}

function toDate(value: string): Date {
  return new Date(value);
}

function toDateString(date: Date): string {
  return date.toISOString();
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

export async function createUser(input: RegisterUserInput): Promise<AuthUser> {
  const now = toDateString(new Date());
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    email: input.email,
    passwordHash: input.passwordHash,
    name: input.name ?? null,
    role: "user",
    status: "unverified",
    loginAttempts: 0,
    lockUntil: null,
    createdAt: now,
    updatedAt: now,
    lastLogin: null,
  });

  return {
    id: userId,
    email: input.email,
    name: input.name ?? null,
    role: "user",
    status: "unverified",
  };
}

export async function findPasswordResetByToken(
  token: string,
): Promise<PasswordResetRequest | null> {
  const [record] = await db
    .select({
      id: passwordResets.id,
      userId: passwordResets.userId,
      expiresAt: passwordResets.expiresAt,
      usedAt: passwordResets.usedAt,
      email: users.email,
      name: users.name,
    })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(eq(passwordResets.token, token))
    .limit(1);

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    expiresAt: toDate(record.expiresAt),
    usedAt: record.usedAt ? toDate(record.usedAt) : null,
    user: {
      email: record.email,
      name: record.name ?? null,
    },
  };
}

export async function completePasswordReset(input: {
  resetId: string;
  userId: string;
  passwordHash: string;
}): Promise<void> {
  const now = toDateString(new Date());

  await db
    .update(users)
    .set({
      passwordHash: input.passwordHash,
      updatedAt: now,
    })
    .where(eq(users.id, input.userId));

  await db
    .update(passwordResets)
    .set({ usedAt: now })
    .where(
      and(eq(passwordResets.id, input.resetId), eq(passwordResets.userId, input.userId)),
    );

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, input.userId));
}
