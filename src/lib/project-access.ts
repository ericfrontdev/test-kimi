import { prisma } from "@/lib/prisma";

export type EffectiveRole = "OWNER" | "ADMIN" | "MEMBER";

/**
 * Vérifie l'accès d'un utilisateur à un projet et retourne son rôle effectif.
 *
 * Les SUPER_ADMIN ont accès à tous les projets avec le rôle OWNER,
 * ce qui leur permet de faire toutes les actions (supprimer, inviter, etc.)
 * même sur des projets dont ils ne sont pas membres.
 *
 * @param userId    - ID Supabase de l'utilisateur
 * @param projectId - ID du projet
 * @param required  - Niveau d'accès minimum requis ("any" | "admin" | "owner")
 * @returns L'objet projet + rôle effectif, ou null si accès refusé
 */
export async function getProjectAccess(
  userId: string,
  projectId: string,
  required: "any" | "admin" | "owner" = "any"
) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });

  const isSuperAdmin = dbUser?.platformRole === "SUPER_ADMIN";

  // Les super admins ont accès à tout sans restriction
  const where = isSuperAdmin
    ? { id: projectId }
    : required === "owner"
    ? { id: projectId, ownerId: userId }
    : required === "admin"
    ? {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: "ADMIN" as const } } },
        ],
      }
    : {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      };

  const project = await prisma.project.findFirst({ where });
  if (!project) return null;

  let effectiveRole: EffectiveRole;
  if (isSuperAdmin) {
    effectiveRole = "OWNER";
  } else if (project.ownerId === userId) {
    effectiveRole = "OWNER";
  } else {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId },
      select: { role: true },
    });
    effectiveRole = (member?.role as "ADMIN" | "MEMBER") ?? "MEMBER";
  }

  return { project, effectiveRole, isSuperAdmin };
}
