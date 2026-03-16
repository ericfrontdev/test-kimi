-- CreateTable
CREATE TABLE "super_admin_invitations" (
    "id"          TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "token"       TEXT NOT NULL,
    "status"      "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "acceptedAt"  TIMESTAMP(3),

    CONSTRAINT "super_admin_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admin_invitations_token_key" ON "super_admin_invitations"("token");

-- AddForeignKey
ALTER TABLE "super_admin_invitations" ADD CONSTRAINT "super_admin_invitations_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
