/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,slug]` on the table `wiki_page` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorId` to the `wiki_page` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `wiki_page` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `wiki_page` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "wiki_page" ADD COLUMN     "authorId" TEXT NOT NULL,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "wiki_version" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "changeNote" TEXT,
    "version" INTEGER NOT NULL,
    "pageId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_page_tag" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "wiki_page_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wiki_version_pageId_idx" ON "wiki_version"("pageId");

-- CreateIndex
CREATE INDEX "wiki_version_authorId_idx" ON "wiki_version"("authorId");

-- CreateIndex
CREATE INDEX "wiki_tag_workspaceId_idx" ON "wiki_tag"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_tag_workspaceId_slug_key" ON "wiki_tag"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "wiki_page_tag_pageId_idx" ON "wiki_page_tag"("pageId");

-- CreateIndex
CREATE INDEX "wiki_page_tag_tagId_idx" ON "wiki_page_tag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_page_tag_pageId_tagId_key" ON "wiki_page_tag"("pageId", "tagId");

-- CreateIndex
CREATE INDEX "wiki_page_workspaceId_idx" ON "wiki_page"("workspaceId");

-- CreateIndex
CREATE INDEX "wiki_page_authorId_idx" ON "wiki_page"("authorId");

-- CreateIndex
CREATE INDEX "wiki_page_parentId_idx" ON "wiki_page"("parentId");

-- CreateIndex
CREATE INDEX "wiki_page_messageId_idx" ON "wiki_page"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_page_workspaceId_slug_key" ON "wiki_page"("workspaceId", "slug");

-- AddForeignKey
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page" ADD CONSTRAINT "wiki_page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "wiki_page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_version" ADD CONSTRAINT "wiki_version_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "wiki_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_version" ADD CONSTRAINT "wiki_version_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_tag" ADD CONSTRAINT "wiki_tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page_tag" ADD CONSTRAINT "wiki_page_tag_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "wiki_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page_tag" ADD CONSTRAINT "wiki_page_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "wiki_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
