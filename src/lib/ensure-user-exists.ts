import { prisma } from "@/lib/prisma";

/**
 * Ensures the user exists in the database with the correct Supabase UUID.
 *
 * Old Kimi-generated code created users with random Prisma UUIDs instead of
 * Supabase auth UUIDs. When such a user logs in, their email already exists in
 * the DB under a different UUID. This function detects the mismatch and
 * migrates all FK references atomically in the correct order:
 *
 *   1. Rename old user's email (free the UNIQUE constraint)
 *   2. Create new user with correct UUID + real email
 *   3. Migrate all FK references from old UUID to new UUID
 *   4. Delete old user (no FK references remain)
 *
 * The previous implementation did step 3 before step 2, causing an immediate
 * FK constraint violation (project_members.userId → users.id) because the new
 * UUID didn't exist in users yet, which silently aborted the migration.
 */
export async function ensureUserExists(
  userId: string,
  email: string,
  name?: string
) {
  // Fast path: correct Supabase UUID already exists
  const existingById = await prisma.user.findUnique({ where: { id: userId } });
  if (existingById) return existingById;

  // Slow path: email exists with a different UUID (legacy data from old version)
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    const oldId = existingByEmail.id;
    const displayName = name || existingByEmail.name || email.split("@")[0];

    return await prisma.$transaction(async (tx) => {
      // 1. Free the email UNIQUE constraint by renaming old user temporarily
      await tx.user.update({
        where: { id: oldId },
        data: { email: `${oldId}@migrated.invalid` },
      });

      // 2. Create new user with the correct Supabase UUID and real email
      const newUser = await tx.user.create({
        data: { id: userId, email, name: displayName },
      });

      // 3. Migrate all FK references (new UUID now exists — no FK violation)
      await tx.projectMember.updateMany({ where: { userId: oldId }, data: { userId } });
      await tx.project.updateMany({ where: { ownerId: oldId }, data: { ownerId: userId } });
      await tx.story.updateMany({ where: { authorId: oldId }, data: { authorId: userId } });
      await tx.story.updateMany({ where: { assigneeId: oldId }, data: { assigneeId: userId } });
      await tx.task.updateMany({ where: { assigneeId: oldId }, data: { assigneeId: userId } });
      await tx.comment.updateMany({ where: { authorId: oldId }, data: { authorId: userId } });
      await tx.taskComment.updateMany({ where: { authorId: oldId }, data: { authorId: userId } });
      await tx.notification.updateMany({ where: { userId: oldId }, data: { userId } });
      await tx.invitation.updateMany({ where: { invitedById: oldId }, data: { invitedById: userId } });

      // 4. Delete old user — all FK references have been migrated
      await tx.user.delete({ where: { id: oldId } });

      return newUser;
    });
  }

  // User doesn't exist at all: create with Supabase UUID
  return await prisma.user.create({
    data: { id: userId, email, name: name || email.split("@")[0] },
  });
}
