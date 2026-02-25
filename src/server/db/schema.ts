import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name"),
  role: text("role").notNull(),
  status: text("status").notNull(),
  loginAttempts: integer("loginAttempts").notNull(),
  lockUntil: text("lockUntil"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  lastLogin: text("lastLogin"),
});

export const passwordResets = sqliteTable("PasswordReset", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  token: text("token").notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").notNull(),
  usedAt: text("usedAt"),
  ipAddress: text("ipAddress"),
});

export const refreshTokens = sqliteTable("RefreshToken", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  token: text("token").notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").notNull(),
  revokedAt: text("revokedAt"),
  deviceInfo: text("deviceInfo"),
});
