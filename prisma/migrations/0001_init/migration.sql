-- Create tables for NextAuth
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    PRIMARY KEY ("identifier", "token")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- Domain tables
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'US',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "email" TEXT,
    "website" TEXT,
    "orgId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Person_name_idx" ON "Person"("name");
CREATE INDEX "Person_orgId_idx" ON "Person"("orgId");

CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "entityType" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Submission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Submission_status_idx" ON "Submission"("status");
CREATE INDEX "Submission_entityType_idx" ON "Submission"("entityType");
CREATE INDEX "Submission_createdById_idx" ON "Submission"("createdById");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- FTS5 virtual table + triggers for Organization and Person
CREATE VIRTUAL TABLE IF NOT EXISTS "OrgFts" USING fts5(
  orgId UNINDEXED,
  name,
  description,
  tags,
  content=''
);

CREATE VIRTUAL TABLE IF NOT EXISTS "PersonFts" USING fts5(
  personId UNINDEXED,
  name,
  title,
  bio,
  content=''
);

CREATE TRIGGER IF NOT EXISTS org_ai AFTER INSERT ON "Organization" BEGIN
  INSERT INTO "OrgFts"(orgId, name, description, tags) VALUES (new.id, new.name, coalesce(new.description,''), coalesce(new.tags,''));
END;
CREATE TRIGGER IF NOT EXISTS org_ad AFTER DELETE ON "Organization" BEGIN
  DELETE FROM "OrgFts" WHERE orgId = old.id;
END;
CREATE TRIGGER IF NOT EXISTS org_au AFTER UPDATE ON "Organization" BEGIN
  DELETE FROM "OrgFts" WHERE orgId = old.id;
  INSERT INTO "OrgFts"(orgId, name, description, tags) VALUES (new.id, new.name, coalesce(new.description,''), coalesce(new.tags,''));
END;

CREATE TRIGGER IF NOT EXISTS person_ai AFTER INSERT ON "Person" BEGIN
  INSERT INTO "PersonFts"(personId, name, title, bio) VALUES (new.id, new.name, coalesce(new.title,''), coalesce(new.bio,''));
END;
CREATE TRIGGER IF NOT EXISTS person_ad AFTER DELETE ON "Person" BEGIN
  DELETE FROM "PersonFts" WHERE personId = old.id;
END;
CREATE TRIGGER IF NOT EXISTS person_au AFTER UPDATE ON "Person" BEGIN
  DELETE FROM "PersonFts" WHERE personId = old.id;
  INSERT INTO "PersonFts"(personId, name, title, bio) VALUES (new.id, new.name, coalesce(new.title,''), coalesce(new.bio,''));
END;
