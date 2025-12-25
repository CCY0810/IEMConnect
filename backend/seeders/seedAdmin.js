/**
 * Super Admin Seed Script
 * Creates the first super admin account from environment variables
 * 
 * Usage: npm run seed:admin
 * 
 * Required environment variables:
 * - SUPER_ADMIN_EMAIL
 * - SUPER_ADMIN_PASSWORD  
 * - SUPER_ADMIN_NAME
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

async function seedSuperAdmin() {
  console.log('🔐 Super Admin Seed Script');
  console.log('='.repeat(50));

  // Validate environment variables
  const { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME } = process.env;

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD || !SUPER_ADMIN_NAME) {
    console.error('❌ Missing required environment variables:');
    if (!SUPER_ADMIN_EMAIL) console.error('   - SUPER_ADMIN_EMAIL');
    if (!SUPER_ADMIN_PASSWORD) console.error('   - SUPER_ADMIN_PASSWORD');
    if (!SUPER_ADMIN_NAME) console.error('   - SUPER_ADMIN_NAME');
    console.log('\nAdd these to your .env file and try again.');
    process.exit(1);
  }

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if super admin already exists
    const [existing] = await sequelize.query(
      'SELECT id, email, role FROM users WHERE email = ? OR role = "admin" LIMIT 1',
      {
        replacements: [SUPER_ADMIN_EMAIL],
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing) {
      console.log(`\n⚠️  Admin account already exists:`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      console.log('\nNo changes made. To create a new admin, use the Admin Invite feature.');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Create super admin
    await sequelize.query(
      `INSERT INTO users (
        name, email, password_hash, role, membership_number, matric_number, 
        faculty, is_verified, createdAt, updatedAt
      ) VALUES (?, ?, ?, 'admin', 'ADMIN1', 'ADMIN0001', 'Faculty of Computing', 1, NOW(), NOW())`,
      {
        replacements: [SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, passwordHash],
      }
    );

    console.log('\n✅ Super Admin created successfully!');
    console.log('='.repeat(50));
    console.log(`   Name:  ${SUPER_ADMIN_NAME}`);
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Role:  admin`);
    console.log('='.repeat(50));
    console.log('\n🔒 For security, please:');
    console.log('   1. Change the password after first login');
    console.log('   2. Remove SUPER_ADMIN_PASSWORD from .env');
    console.log('\n🎉 You can now login at /login');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedSuperAdmin();
