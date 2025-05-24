@echo off
set DATABASE_URL=postgresql://postgres:ermak1109@localhost:5432/ermakplan
set PGUSER=postgres
set PGPASSWORD=ermak1109
set PGDATABASE=ermakplan
set PGHOST=localhost
set PGPORT=5432
npx tsx server/index.ts