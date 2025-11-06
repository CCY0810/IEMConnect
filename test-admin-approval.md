# Admin User Approval Feature Test

## Feature Overview

This feature allows admin users to approve new registrations before they can log in to the system.

## Components Implemented

### Backend

1. **New Controller Functions** (`backend/controllers/authController.js`):

   - `getUnverifiedUsers`: Returns list of unverified users (admin only)
   - `verifyUser`: Verifies a user and sends confirmation email (admin only)

2. **New Routes** (`backend/routes/auth.js`):

   - `GET /auth/unverified-users`: Get list of unverified users
   - `POST /auth/verify-user`: Verify a specific user

3. **Enhanced Email Service** (`backend/utils/emailService.js`):
   - `sendAccountVerifiedEmail`: Sends confirmation when user is approved

### Frontend

1. **Admin API Service** (`frontend/lib/admin-api.ts`):

   - Functions to call the new backend endpoints

2. **Enhanced Dashboard** (`frontend/app/dashboard/page.tsx`):

   - Admins see "Approve New Users" button
   - Toggleable approval panel with user table
   - One-click verification with success/error feedback

3. **New UI Components** (copied to `frontend/components/ui/`):
   - `table.tsx`: For displaying user data
   - `alert.tsx`: For showing success/error messages
   - `badge.tsx`: For admin role indicator

## Testing the Feature

### Prerequisites

1. Ensure you have at least one admin user in the database:

   ```sql
   INSERT INTO users (name, email, password_hash, role, membership_number, is_verified)
   VALUES ('Admin User', 'admin@example.com', '$2a$10$example_hash', 'admin', 'ADM001', 1);
   ```

2. Ensure you have at least one unverified user:
   ```sql
   INSERT INTO users (name, email, password_hash, role, membership_number, is_verified)
   VALUES ('Test User', 'test@example.com', '$2a$10$example_hash', 'member', 'TEST01', 0);
   ```

### Test Steps

1. **Login as Admin**

   - Navigate to login page
   - Enter admin credentials
   - Complete 2FA process

2. **Access Admin Panel**

   - On dashboard, look for "Admin Panel" section
   - Click "Approve New Users" button
   - Verify that unverified users appear in the table

3. **Approve User**

   - Click "Verify" button next to a user
   - Confirm success message appears
   - Verify user disappears from the list
   - Check that user received verification email

4. **Verify User Can Now Login**
   - Attempt to login with the newly verified user's credentials
   - Confirm they can now proceed past the login step

### Expected Outcomes

- Admins can see the approval panel with unverified users
- Regular users do not see the approval panel
- Users are successfully verified when admin clicks "Verify"
- Verified users can log in to the system
- Appropriate success/error messages are displayed
