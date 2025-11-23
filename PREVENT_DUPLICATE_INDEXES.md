# Preventing Duplicate Index Creation in Sequelize

## Problem
Sequelize was automatically creating duplicate indexes (`email`, `email_2`, `email_3`, etc.) on every application start, eventually hitting MySQL's 64-index limit.

## Root Cause
1. Sequelize models define indexes in their schema
2. When models load, Sequelize may attempt to create/validate indexes
3. If a UNIQUE constraint fails (due to duplicate data or other issues), Sequelize creates fallback non-unique indexes
4. This repeats on every app start, creating `email_2`, `email_3`, etc.

## Solution Implemented

### 1. Disabled Automatic Schema Synchronization ✅
**File:** `backend/config/database.js`
- Added `sync: false` to Sequelize config
- Added `define.freezeTableName: true` to prevent automatic modifications

### 2. Added Sync Protection Utility ✅
**File:** `backend/utils/preventSequelizeSync.js`
- Overrides `sequelize.sync()` to block automatic sync
- Overrides `model.sync()` for all models
- Only allows sync in development with explicit `force: true` flag
- Logs warnings when sync is attempted

### 3. Updated Server Startup ✅
**File:** `backend/server.js`
- Imports and calls `preventAutoSync()` at startup
- Ensures protection is active before any models load

### 4. Model Index Definitions ✅
**File:** `backend/models/User.js`
- Indexes are defined for documentation/reference only
- Comments added to clarify indexes should exist via migrations
- `freezeTableName: true` added to prevent automatic modifications

### 5. Migration to Fix Existing Issues ✅
**File:** `backend/migrations/fix_unique_constraints_and_prevent_duplicates.sql`
- Drops all duplicate indexes (email_2, email_3, etc.)
- Creates only the correct unique indexes
- Verifies no duplicate data exists
- Provides procedures to clean up duplicates

## How to Apply the Fix

### Step 1: Clean Up Existing Duplicate Indexes
```bash
# Run the cleanup migration
Get-Content backend/migrations/fix_unique_constraints_and_prevent_duplicates.sql | mysql -u root -p IEM_CONNECT
```

### Step 2: Verify No Duplicate Data
The migration will show you if there are duplicate emails or matric numbers. Fix any duplicates before proceeding.

### Step 3: Restart the Application
The code changes are already in place. Just restart your server:
```bash
cd backend
npm run dev
```

### Step 4: Verify Protection is Active
Check the console logs. You should see:
```
[SYNC PROTECTION] Sequelize automatic schema sync is now disabled
```

If you see warnings like:
```
[SEQUELIZE SYNC BLOCKED] Automatic schema synchronization is disabled...
```
This means the protection is working correctly.

## Verification

### Check Current Indexes
```sql
SHOW INDEXES FROM users;
```

You should only see:
- `PRIMARY` (on `id`)
- `unique_email` (on `email`)
- `unique_matric_number` (on `matric_number`)
- Any other indexes you've explicitly created via migrations

### Check for Duplicates
```sql
-- Should return 0 rows if no duplicates
SELECT email, COUNT(*) as count 
FROM users 
GROUP BY email 
HAVING count > 1;

SELECT matric_number, COUNT(*) as count 
FROM users 
GROUP BY matric_number 
HAVING count > 1;
```

## Prevention Checklist

✅ **Automatic sync disabled** - `sync: false` in database config
✅ **Sync protection utility** - Blocks all sync attempts
✅ **Model freeze enabled** - `freezeTableName: true` prevents modifications
✅ **Indexes via migrations only** - All indexes created via SQL migrations
✅ **Unique constraints verified** - Migration checks for duplicate data

## Important Notes

1. **Never use `sequelize.sync()` in production** - It's now blocked by default
2. **All schema changes must use migrations** - Create SQL migration files
3. **Indexes in model definitions are for reference only** - They don't auto-create
4. **If you need to sync in development** - Use `sequelize.sync({ force: true, alter: true })` explicitly (not recommended)

## Troubleshooting

### If indexes are still being created:
1. Check that `preventAutoSync()` is called before models are imported
2. Verify no other code is calling `sequelize.sync()` or `model.sync()`
3. Check for any migration tools or ORM plugins that might auto-sync

### If you need to temporarily allow sync:
Set environment variable:
```bash
NODE_ENV=development
```
And explicitly call:
```javascript
sequelize.sync({ force: true, alter: true }); // NOT RECOMMENDED
```

### If you see duplicate data errors:
Fix duplicate emails/matric numbers in the database before creating unique indexes:
```sql
-- Find duplicates
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- Fix them (example - modify as needed)
UPDATE users SET email = CONCAT(email, '_', id) WHERE id IN (...);
```

## Summary

The system is now configured to:
- ✅ Block all automatic schema synchronization
- ✅ Require explicit migrations for schema changes
- ✅ Prevent duplicate index creation
- ✅ Log warnings if sync is attempted
- ✅ Only allow sync in development with explicit flags

Your database schema is now managed exclusively through migrations, preventing the duplicate index issue from recurring.

