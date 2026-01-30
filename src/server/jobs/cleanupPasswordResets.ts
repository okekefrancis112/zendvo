import { prisma } from "@/lib/prisma";

export async function cleanupExpiredTokens() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.passwordReset.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { createdAt: { lt: twentyFourHoursAgo } },
          { usedAt: { not: null } },
        ],
      },
    });

    console.log(
      `[CLEANUP_JOB] Deleted ${result.count} expired/used password reset tokens.`,
    );
    return result.count;
  } catch (error) {
    console.error("[CLEANUP_JOB_ERROR]", error);
    throw error;
  }
}

if (require.main === module) {
  cleanupExpiredTokens()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
