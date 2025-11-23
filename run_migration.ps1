# PowerShell script to run MySQL migration
# Usage: .\run_migration.ps1

$database = "IEM_CONNECT"
$migrationFile = "backend/migrations/add_performance_indexes.sql"

Write-Host "Running MySQL migration: $migrationFile" -ForegroundColor Cyan
Write-Host "Database: $database" -ForegroundColor Cyan
Write-Host ""

# Read the SQL file content
$sqlContent = Get-Content -Path $migrationFile -Raw

# Run the migration
mysql -u root -p $database -e $sqlContent

Write-Host ""
Write-Host "Migration completed!" -ForegroundColor Green

