# Fix for Duplicate Index Creation Issue

## Problem
Sequelize was automatically creating duplicate indexes (`email`, `email_2`, `email_3`, etc.) on every application start, hitting MySQL's 64-index limit.

## Solution Implemented

### 1. Database Config Protection ✅
**File:** `backend/config/database.js`
- Added `sync: false` to disable automatic sync
- Added `freezeTableName: true` to prevent schema modifications
- Overrides `sequelize.sync()` method directly in config (runs BEFORE models load)

### 2. Server-Level Protection ✅
**File:** `backend/server.js`
- Calls `preventAutoSync()` at startup
- Protects model-level sync operations

### 3. Model Updates ✅
**File:** `backend/models/User.js`
- Added comments clarifying indexes are for reference only
- Added `freezeTableName: true`

### 4. Cleanup Migration ✅
**File:** `backend/migrations/fix_unique_constraints_and_prevent_duplicates.sql`
- Drops all duplicate indexes
- Creates only the correct unique indexes
- Verifies no duplicate data exists

## How to Apply the Fix

### Step 1: Clean Up Existing Duplicates
```powershell
Get-Content backend/migrations/fix_unique_constraints_and_prevent_duplicates.sql | mysql -u root -p IEM_CONNECT
```

### Step 2: Verify Cleanup
```powershell
Get-Content backend/migrations/verify_no_duplicate_indexes.sql | mysql -u root -p IEM_CONNECT
```

You should only see:
- `PRIMARY` (on `id`)
- `unique_email` (on `email`)
- `unique_matric_number` (on `matric_number`)

### Step 3: Restart Server
The code changes are already in place. Just restart:
```bash
cd backend
npm run dev
```

### Step 4: Verify Protection is Active
Check console logs. You should see:
```
[SYNC PROTECTION] Model-level sync protection enabled
```

If sync is attempted, you'll see:
```
[SEQUELIZE SYNC BLOCKED] Automatic schema synchronization is disabled...
```

## What Changed

### Before:
- Sequelize could auto-create indexes on model load
- Failed unique constraints created fallback indexes
- Indexes duplicated on every app start

### After:
- ✅ Sync is blocked at database config level
- ✅ Model sync is blocked at server level
- ✅ All schema changes must use migrations
- ✅ Indexes defined in models are for reference only

## Verification Commands

### Check Current Indexes:
```sql
SHOW INDEXES FROM users;
```

### Check for Duplicates:
```sql
SELECT INDEX_NAME, COUNT(*) 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'IEM_CONNECT' 
  AND TABLE_NAME = 'users'
  AND INDEX_NAME LIKE 'email%'
GROUP BY INDEX_NAME;
```

### Check Total Index Count:
```sql
SELECT COUNT(DISTINCT INDEX_NAME) as total_indexes
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'IEM_CONNECT'
  AND TABLE_NAME = 'users'
  AND INDEX_NAME != 'PRIMARY';
```

Should be a small number (3-10), not near 64.

## Important Notes

1. **Never call `sequelize.sync()`** - It's now blocked
2. **All schema changes = migrations** - Create SQL files
3. **Indexes in models = documentation only** - They don't auto-create
4. **If you see sync warnings** - That's good! Protection is working

## Troubleshooting

### If duplicates still appear:
1. Check that `preventAutoSync()` runs before models load
2. Verify no other code calls `sync()`
3. Check for migration tools that auto-sync

### If you need to sync (development only):
```javascript
// NOT RECOMMENDED - Only for development
sequelize.sync({ force: true, alter: true });
```

The system will warn you but allow it in development mode.

