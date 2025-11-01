CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Person" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("userId", name)
);

CREATE TABLE IF NOT EXISTS "SavingEntry" (
    id SERIAL PRIMARY KEY,
    "personId" INTEGER NOT NULL REFERENCES "Person"(id) ON DELETE CASCADE,
    label VARCHAR(128) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Session" (
    id TEXT PRIMARY KEY,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS "SavingEntry_personId_idx" ON "SavingEntry" ("personId");
CREATE INDEX IF NOT EXISTS "SavingEntry_createdAt_idx" ON "SavingEntry" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Person_userId_idx" ON "Person" ("userId");
