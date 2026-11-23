/*
  Warnings:

  - You are about to drop the `RefreshSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RefreshSession" DROP CONSTRAINT "RefreshSession_user_id_fkey";

-- DropTable
DROP TABLE "RefreshSession";
