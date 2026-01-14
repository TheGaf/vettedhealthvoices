-- MVP migration: core tables + FTS5 virtual tables + triggers

PRAGMA foreign_keys=ON;

-- NextAuth tables
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" DATETIME,
  "image" TEXT,
  "isAdmin" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Account" (
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
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider","providerAccountId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" DATETIME NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier","token");

-- Domain/Creator/Feed/Item
CREATE TABLE IF NOT EXISTS "Domain" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "host" TEXT NOT NULL UNIQUE,
  "isBlocked" BOOLEAN NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Creator" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "primaryDomain" TEXT,
  "domainId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Creator_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Feed" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "domainId" TEXT,
  "url" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT 1,
  "lastFetched" DATETIME,
  "etag" TEXT,
  "lastMod" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Feed_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Feed_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Item" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "feedId" TEXT,
  "title" TEXT NOT NULL,
  "canonicalUrl" TEXT NOT NULL UNIQUE,
  "url" TEXT NOT NULL,
  "excerpt" TEXT,
  "contentText" TEXT,
  "publishedAt" DATETIME,
  "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Item_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Item_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Moderation / reporting
CREATE TABLE IF NOT EXISTS "Verification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT,
  "creatorId" TEXT,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "decidedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Verification_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Verification_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DomainBlocklist" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "host" TEXT NOT NULL UNIQUE,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT
);

CREATE TABLE IF NOT EXISTS "KeywordBlocklist" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "keyword" TEXT NOT NULL UNIQUE,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "reporterId" TEXT,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Report_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ModerationAction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadataJson" TEXT,
  "moderationActionId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_moderationActionId_fkey" FOREIGN KEY ("moderationActionId") REFERENCES "ModerationAction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "IngestRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "feedId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" DATETIME,
  "error" TEXT,
  "statsJson" TEXT,
  CONSTRAINT "IngestRun_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- FTS5
CREATE VIRTUAL TABLE IF NOT EXISTS "CreatorFts" USING fts5(
  creatorId UNINDEXED,
  name,
  description,
  primaryDomain,
  content='Creator',
  content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS "ItemFts" USING fts5(
  itemId UNINDEXED,
  title,
  excerpt,
  contentText,
  canonicalUrl,
  content='Item',
  content_rowid='rowid'
);

-- Triggers keep FTS in sync

CREATE TRIGGER IF NOT EXISTS creator_ai AFTER INSERT ON "Creator" BEGIN
  INSERT INTO "CreatorFts"(rowid, creatorId, name, description, primaryDomain)
  VALUES (new.rowid, new.id, new.name, coalesce(new.description,''), coalesce(new.primaryDomain,''));
END;

CREATE TRIGGER IF NOT EXISTS creator_ad AFTER DELETE ON "Creator" BEGIN
  INSERT INTO "CreatorFts"("CreatorFts", rowid, creatorId, name, description, primaryDomain)
  VALUES('delete', old.rowid, old.id, old.name, coalesce(old.description,''), coalesce(old.primaryDomain,''));
END;

CREATE TRIGGER IF NOT EXISTS creator_au AFTER UPDATE ON "Creator" BEGIN
  INSERT INTO "CreatorFts"("CreatorFts", rowid, creatorId, name, description, primaryDomain)
  VALUES('delete', old.rowid, old.id, old.name, coalesce(old.description,''), coalesce(old.primaryDomain,''));
  INSERT INTO "CreatorFts"(rowid, creatorId, name, description, primaryDomain)
  VALUES (new.rowid, new.id, new.name, coalesce(new.description,''), coalesce(new.primaryDomain,''));
END;

CREATE TRIGGER IF NOT EXISTS item_ai AFTER INSERT ON "Item" BEGIN
  INSERT INTO "ItemFts"(rowid, itemId, title, excerpt, contentText, canonicalUrl)
  VALUES (new.rowid, new.id, new.title, coalesce(new.excerpt,''), coalesce(new.contentText,''), new.canonicalUrl);
END;

CREATE TRIGGER IF NOT EXISTS item_ad AFTER DELETE ON "Item" BEGIN
  INSERT INTO "ItemFts"("ItemFts", rowid, itemId, title, excerpt, contentText, canonicalUrl)
  VALUES('delete', old.rowid, old.id, old.title, coalesce(old.excerpt,''), coalesce(old.contentText,''), old.canonicalUrl);
END;

CREATE TRIGGER IF NOT EXISTS item_au AFTER UPDATE ON "Item" BEGIN
  INSERT INTO "ItemFts"("ItemFts", rowid, itemId, title, excerpt, contentText, canonicalUrl)
  VALUES('delete', old.rowid, old.id, old.title, coalesce(old.excerpt,''), coalesce(old.contentText,''), old.canonicalUrl);
  INSERT INTO "ItemFts"(rowid, itemId, title, excerpt, contentText, canonicalUrl)
  VALUES (new.rowid, new.id, new.title, coalesce(new.excerpt,''), coalesce(new.contentText,''), new.canonicalUrl);
END;
