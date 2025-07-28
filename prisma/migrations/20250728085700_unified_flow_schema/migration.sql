/*
  Warnings:

  - You are about to drop the `FlowJob` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Flow` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `flowname` to the `Flow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobStructure` to the `Flow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `progress` to the `Flow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `queueName` to the `Flow` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "FlowJob_jobId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FlowJob";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Flow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "jobStructure" JSONB NOT NULL,
    "rootJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" JSONB NOT NULL,
    "result" JSONB,
    "error" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "Flow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Flow" ("createdAt", "id", "name", "updatedAt", "userId") SELECT "createdAt", "id", "name", "updatedAt", "userId" FROM "Flow";
DROP TABLE "Flow";
ALTER TABLE "new_Flow" RENAME TO "Flow";
CREATE INDEX "Flow_userId_status_idx" ON "Flow"("userId", "status");
CREATE INDEX "Flow_flowname_idx" ON "Flow"("flowname");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
