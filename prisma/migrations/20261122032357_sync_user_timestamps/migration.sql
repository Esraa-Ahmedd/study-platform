-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "age" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ParentStudent" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkingCode" (
    "id" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkingCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParentStudent_parent_id_status_idx" ON "ParentStudent"("parent_id", "status");

-- CreateIndex
CREATE INDEX "ParentStudent_student_id_status_idx" ON "ParentStudent"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudent_parent_id_student_id_key" ON "ParentStudent"("parent_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_token_hash_key" ON "RefreshSession"("token_hash");

-- CreateIndex
CREATE INDEX "RefreshSession_user_id_idx" ON "RefreshSession"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LinkingCode_code_hash_key" ON "LinkingCode"("code_hash");

-- CreateIndex
CREATE INDEX "LinkingCode_student_id_idx" ON "LinkingCode"("student_id");

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkingCode" ADD CONSTRAINT "LinkingCode_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
