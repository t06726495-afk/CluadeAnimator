-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "planInterval" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Practice',
    "date" DATETIME NOT NULL,
    "totalDurationMinutes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "practices_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "coachNotes" TEXT,
    CONSTRAINT "blocks_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "practices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coachingCues" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "ownerUserId" TEXT,
    CONSTRAINT "drills_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drill_age_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drillId" TEXT NOT NULL,
    "ageTier" TEXT NOT NULL,
    CONSTRAINT "drill_age_tiers_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "drills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drill_skill_levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drillId" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    CONSTRAINT "drill_skill_levels_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "drills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_drill_selections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "coachNote" TEXT,
    CONSTRAINT "practice_drill_selections_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "practice_drill_selections_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "drills" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "teams_userId_idx" ON "teams"("userId");

-- CreateIndex
CREATE INDEX "practices_teamId_idx" ON "practices"("teamId");

-- CreateIndex
CREATE INDEX "blocks_practiceId_order_idx" ON "blocks"("practiceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "drills_slug_key" ON "drills"("slug");

-- CreateIndex
CREATE INDEX "drills_category_idx" ON "drills"("category");

-- CreateIndex
CREATE INDEX "drills_ownerUserId_idx" ON "drills"("ownerUserId");

-- CreateIndex
CREATE INDEX "drill_age_tiers_ageTier_idx" ON "drill_age_tiers"("ageTier");

-- CreateIndex
CREATE UNIQUE INDEX "drill_age_tiers_drillId_ageTier_key" ON "drill_age_tiers"("drillId", "ageTier");

-- CreateIndex
CREATE INDEX "drill_skill_levels_skillLevel_idx" ON "drill_skill_levels"("skillLevel");

-- CreateIndex
CREATE UNIQUE INDEX "drill_skill_levels_drillId_skillLevel_key" ON "drill_skill_levels"("drillId", "skillLevel");

-- CreateIndex
CREATE INDEX "practice_drill_selections_blockId_order_idx" ON "practice_drill_selections"("blockId", "order");
