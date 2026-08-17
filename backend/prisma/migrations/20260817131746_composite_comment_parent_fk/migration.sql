/*
  Warnings:

  - A unique constraint covering the columns `[id,postId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Comment_id_postId_key" ON "Comment"("id", "postId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_postId_fkey" FOREIGN KEY ("parentId", "postId") REFERENCES "Comment"("id", "postId") ON DELETE CASCADE ON UPDATE CASCADE;
