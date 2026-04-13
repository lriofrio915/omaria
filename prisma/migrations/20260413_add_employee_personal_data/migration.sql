-- AlterTable: add personal data fields to employees
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "birthDate"     TIMESTAMP(3);
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "personalEmail" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "bloodType"     TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "address"       TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "city"          TEXT;
