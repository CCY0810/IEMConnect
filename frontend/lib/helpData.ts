/**
 * Help Centre / FAQ Data
 * Comprehensive documentation for all IEM Connect features
 * Derived from codebase analysis - covers all implemented functionality
 */

export interface HelpQuestion {
  id: string;
  question: string;
  answer: string;
  adminOnly?: boolean;
  keywords: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: HelpQuestion[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "🚀",
    description: "Account creation, login, and authentication",
    questions: [
      {
        id: "create-account",
        question: "How do I create an account?",
        answer: `To create an account on IEM Connect:

1. Click the **Register** button on the homepage
2. Fill in your details:
   - Full Name
   - Email Address (use your university email)
   - Matric Number
   - Faculty
   - Password (minimum 8 characters)
3. Click **Register**
4. Wait for admin approval - you'll receive an email once approved

**Note:** New accounts require admin verification before you can access the platform.`,
        keywords: ["register", "signup", "new account", "create", "join"],
      },
      {
        id: "login",
        question: "How do I log in?",
        answer: `To log in to IEM Connect:

1. Go to the **Login** page
2. Enter your registered **Email** and **Password**
3. Click **Login**
4. If you have 2FA enabled, enter the verification code from your authenticator app

**Trouble logging in?**
- Ensure your account has been approved by an admin
- Check your email and password are correct
- Use the "Forgot Password" link if needed`,
        keywords: ["login", "signin", "access", "enter", "authenticate"],
      },
      {
        id: "2fa",
        question: "What is Two-Factor Authentication (2FA)?",
        answer: `Two-Factor Authentication adds an extra layer of security to your account.

**How it works:**
1. After entering your password, you'll be prompted for a 6-digit code
2. Open your authenticator app (Google Authenticator, Authy, etc.)
3. Enter the code shown for IEM Connect

**Setting up 2FA:**
1. Go to **Settings** > **Security**
2. Toggle on **Two-Factor Authentication**
3. Scan the QR code with your authenticator app
4. Enter the verification code to confirm

**Benefits:**
- Prevents unauthorized access even if your password is compromised
- Required for admin accounts`,
        keywords: ["2fa", "two-factor", "authentication", "security", "code", "authenticator"],
      },
      {
        id: "forgot-password",
        question: "I forgot my password. How do I reset it?",
        answer: `To reset your password:

1. Click **Forgot Password** on the login page
2. Enter your registered email address
3. Click **Send Reset Link**
4. Check your email for the reset link
5. Click the link and create a new password

**Note:** The reset link expires after 1 hour. If you don't receive the email, check your spam folder.`,
        keywords: ["forgot", "password", "reset", "recover", "email"],
      },
    ],
  },
  {
    id: "events",
    title: "Events",
    icon: "📅",
    description: "Browsing, registering, and participating in events",
    questions: [
      {
        id: "browse-events",
        question: "How do I browse available events?",
        answer: `To browse events:

1. Click **Events** in the sidebar navigation
2. View all available events in card format
3. Use the **Search** bar to filter by event name
4. Events are color-coded by status:
   - **Upcoming** - Event hasn't started yet
   - **Open** - Event is currently running
   - **Completed** - Event has ended

**Dashboard Calendar:**
The dashboard also shows events on an interactive calendar view with:
- Green dots = Events you're registered for
- Amber dots = Open events you haven't registered for`,
        keywords: ["browse", "events", "view", "find", "search", "calendar"],
      },
      {
        id: "register-event",
        question: "How do I register for an event?",
        answer: `To register for an event:

1. Navigate to the **Events** page
2. Click on an event to view its details
3. Click the **Register** button
4. You'll see a confirmation message

**After registration:**
- The event will appear on your dashboard calendar (green)
- You'll receive notifications about the event
- You can check in when the event starts

**Note:** You can only register for events that are "Upcoming" or "Open".`,
        keywords: ["register", "event", "join", "signup", "participate"],
      },
      {
        id: "event-details",
        question: "What information can I see about an event?",
        answer: `Event details include:

- **Title** - Event name
- **Description** - What the event is about
- **Date & Time** - When it will be held
- **Location** - Where it will take place
- **Status** - Upcoming, Open, or Completed
- **Director** - Who's organizing the event
- **Poster** - Event promotional image (click to enlarge)
- **Registration Status** - Whether you're registered

You can view event details by clicking on any event card.`,
        keywords: ["details", "information", "event", "view", "description"],
      },
      {
        id: "unregister",
        question: "How do I unregister from an event?",
        answer: `To unregister from an event:

1. Go to the **Events** page
2. Click on the event you're registered for
3. Click the **Unregister** button
4. Confirm your choice

**Note:** You cannot unregister from events that have already completed. If an event has started, contact the event administrator.`,
        keywords: ["unregister", "cancel", "remove", "leave", "withdraw"],
      },
      {
        id: "create-event-admin",
        question: "How do I create a new event?",
        answer: `**Admin Only**

To create a new event:

1. Click **Create Event** on the Events page or Dashboard
2. Fill in the event details:
   - Title, Description
   - Start Date & Time, End Date & Time
   - Location
   - Upload a Poster (optional)
   - Upload Paperwork (optional)
3. Click **Create Event**

**Tips:**
- Add a compelling poster to attract participants
- Set clear start/end times for attendance tracking
- Use descriptive titles and descriptions`,
        adminOnly: true,
        keywords: ["create", "event", "new", "add", "organize", "admin"],
      },
      {
        id: "manage-event-admin",
        question: "How do I manage an existing event?",
        answer: `**Admin Only**

To manage events:

**Editing:**
1. Go to the event details page
2. Click **Edit Event**
3. Modify the details and save

**Starting an Event:**
1. Click **Start Event** to change status from "Upcoming" to "Open"
2. This enables attendance check-in

**Ending an Event:**
1. Click **End Event** to change status to "Completed"
2. This finalizes attendance and enables feedback

**Deleting:**
- Click **Delete Event** (use with caution - this cannot be undone)`,
        adminOnly: true,
        keywords: ["manage", "edit", "start", "end", "delete", "event", "admin"],
      },
      {
        id: "announcements-admin",
        question: "How do I send announcements to event participants?",
        answer: `**Admin Only**

To send an announcement:

1. Go to the event details page
2. Click **Send Announcement**
3. Write your message
4. Click **Send**

The announcement will be sent to all registered participants as:
- In-app notification
- Email notification (if enabled in their settings)

**Use for:**
- Schedule changes
- Important reminders
- Last-minute updates`,
        adminOnly: true,
        keywords: ["announcement", "notify", "message", "participants", "admin"],
      },
    ],
  },
  {
    id: "attendance",
    title: "Attendance",
    icon: "✅",
    description: "Checking in and tracking your attendance",
    questions: [
      {
        id: "checkin-methods",
        question: "How do I check in to an event?",
        answer: `There are two ways to check in:

**1. QR Code Check-in:**
- Open the **Attendance** page
- Select the **QR Code** tab
- Point your camera at the event's QR code
- You'll see a confirmation when successful

**2. Attendance Code:**
- Open the **Attendance** page
- Select the **Code** tab
- Enter the attendance code provided by the organizer
- Click **Submit**

**Requirements:**
- You must be registered for the event
- The event must be "Open" (started by admin)
- Check-in must be enabled by the organizer`,
        keywords: ["check-in", "checkin", "qr", "code", "attendance", "mark"],
      },
      {
        id: "attendance-history",
        question: "Where can I see my attendance history?",
        answer: `To view your attendance history:

1. Go to the **Attendance** page
2. Click the **Attended** tab
3. View all events you've attended with:
   - Event name and date
   - Check-in time
   - Method used (QR/Code)

**Features:**
- Events are shown in chronological order
- You can submit feedback for completed events
- Download certificates for eligible events`,
        keywords: ["history", "attended", "past", "records", "view"],
      },
      {
        id: "manage-attendance-admin",
        question: "How do I manage attendance for an event?",
        answer: `**Admin Only**

To manage attendance:

**Starting Attendance:**
1. Go to the event details page
2. Click **Start Event** (changes status to "Open")
3. Attendance check-in is now enabled

**Stopping Attendance:**
1. Click **End Event** when done
2. No more check-ins will be accepted

**Viewing Attendance List:**
1. Go to **Admin** > **Attendance**
2. Select the event
3. View all check-ins with timestamps and methods

**Manual Check-in:**
- Use the admin attendance panel to manually mark attendance if needed`,
        adminOnly: true,
        keywords: ["manage", "attendance", "start", "stop", "list", "admin"],
      },
    ],
  },
  {
    id: "feedback",
    title: "Feedback",
    icon: "💬",
    description: "Submitting and viewing event feedback",
    questions: [
      {
        id: "submit-feedback",
        question: "How do I submit feedback for an event?",
        answer: `To submit feedback:

1. Go to the **Attendance** page
2. Find the completed event in the **Attended** tab
3. Click **Give Feedback** button
4. Fill out the feedback form:
   - Rating (1-5 stars)
   - Comments (optional)
5. Click **Submit**

**Requirements:**
- You must have attended the event
- The event must be completed
- You can only submit feedback once per event`,
        keywords: ["feedback", "submit", "rating", "review", "comments"],
      },
      {
        id: "view-my-feedback",
        question: "Where can I see my submitted feedback?",
        answer: `Your feedback history is available in the Attendance section:

1. Go to **Attendance** page
2. Events you've given feedback for will show a checkmark
3. The feedback you submitted is stored with that event

**Note:** You cannot edit feedback once submitted.`,
        keywords: ["my feedback", "submitted", "history", "view"],
      },
      {
        id: "feedback-reports-admin",
        question: "How do I view feedback reports?",
        answer: `**Admin Only**

To access feedback reports:

1. Go to **Feedback Reports** in the sidebar
2. View the dashboard showing:
   - Average ratings across all events
   - Rating distribution
   - Total feedback count

**Event-specific feedback:**
1. Select an event from the dropdown
2. View all feedback entries with ratings and comments

**Exporting:**
1. Select an event
2. Click **Export CSV** to download feedback data`,
        adminOnly: true,
        keywords: ["feedback", "reports", "analytics", "export", "admin"],
      },
    ],
  },
  {
    id: "profile-settings",
    title: "Profile & Settings",
    icon: "⚙️",
    description: "Managing your account and preferences",
    questions: [
      {
        id: "edit-profile",
        question: "How do I edit my profile?",
        answer: `To edit your profile:

1. Click your **profile picture** in the top-right corner
2. Or navigate to **Profile** from the sidebar
3. Click **Edit Profile**
4. Update your information:
   - Name
   - Faculty
   - Contact information
5. Click **Save Changes**

**Changing your avatar:**
1. Click the camera icon on your profile picture
2. Upload a new image
3. The image will be cropped to a circle`,
        keywords: ["profile", "edit", "update", "name", "avatar", "picture"],
      },
      {
        id: "change-password",
        question: "How do I change my password?",
        answer: `To change your password:

1. Go to **Settings**
2. Find the **Security** section
3. Enter your **Current Password**
4. Enter your **New Password** (twice to confirm)
5. Click **Change Password**

**Password requirements:**
- Minimum 8 characters
- Recommended: mix of letters, numbers, and symbols`,
        keywords: ["password", "change", "update", "security"],
      },
      {
        id: "notification-preferences",
        question: "How do I manage my notification preferences?",
        answer: `To manage notifications:

1. Go to **Settings**
2. Find the **Notifications** section
3. Toggle notifications on/off for:
   - Event reminders
   - Announcements
   - Registration confirmations
   - Attendance updates
   - System notifications
4. Choose notification frequency:
   - Immediate
   - Daily digest
   - Weekly digest

**In-app notifications:**
Can be toggled separately from email notifications.`,
        keywords: ["notifications", "preferences", "email", "alerts", "settings"],
      },
      {
        id: "export-data",
        question: "How do I export my data?",
        answer: `To export your personal data:

1. Go to **Settings**
2. Find the **Data & Privacy** section
3. Click **Export My Data**
4. A JSON file will download containing:
   - Your profile information
   - Event registrations
   - Attendance records
   - Feedback submissions

This is useful for personal records or data portability.`,
        keywords: ["export", "data", "download", "privacy", "personal"],
      },
      {
        id: "delete-account",
        question: "How do I delete my account?",
        answer: `To delete your account:

1. Go to **Settings**
2. Find the **Danger Zone** section
3. Click **Delete Account**
4. Enter your password to confirm
5. Click **Permanently Delete**

**Warning:**
- This action cannot be undone
- All your data will be permanently removed
- You will lose access to certificates and history

Consider exporting your data first.`,
        keywords: ["delete", "account", "remove", "close", "deactivate"],
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "🔔",
    description: "Understanding and managing notifications",
    questions: [
      {
        id: "notification-types",
        question: "What types of notifications will I receive?",
        answer: `IEM Connect sends notifications for:

**Event Notifications:**
- Event registration confirmations
- Event reminders (before start)
- Event updates and changes
- Announcements from organizers

**Attendance:**
- Check-in confirmations
- Attendance reminders

**Account:**
- Account approval status
- Security alerts (login from new device)
- Password changes

**Admin notifications** (admin only):
- New user registrations pending approval
- System alerts`,
        keywords: ["notifications", "types", "alerts", "what", "receive"],
      },
      {
        id: "manage-notifications",
        question: "How do I manage my notifications?",
        answer: `To manage notifications:

**Viewing:**
1. Click the **Bell icon** in the top-right corner
2. See all your notifications in the dropdown
3. Click a notification to view details

**Marking as read:**
- Click a notification to mark it as read
- Click **Mark All as Read** to clear all

**Deleting:**
- Hover over a notification and click the delete icon

**Preferences:**
- Go to Settings to customize which notifications you receive`,
        keywords: ["manage", "notifications", "read", "delete", "clear"],
      },
    ],
  },
  {
    id: "certificates",
    title: "Certificates",
    icon: "🏆",
    description: "Downloading event certificates",
    questions: [
      {
        id: "download-certificate",
        question: "How do I download my event certificate?",
        answer: `To download a certificate:

1. Go to the **Attendance** page
2. Find the completed event in the **Attended** tab
3. Click the **Certificate** button
4. The certificate will download as a PDF

**Requirements:**
- You must have attended the event (checked in)
- The event must be completed
- Not all events may offer certificates`,
        keywords: ["certificate", "download", "pdf", "proof", "attendance"],
      },
      {
        id: "certificate-requirements",
        question: "What are the requirements for getting a certificate?",
        answer: `To be eligible for a certificate:

1. **Registered** - You must have registered for the event
2. **Attended** - You must have checked in (QR or Code)
3. **Completed** - The event must be marked as completed by the admin

**Certificate includes:**
- Your name
- Event name
- Date of event
- Official IEM Connect branding

If you attended but can't download a certificate, contact the event organizer.`,
        keywords: ["certificate", "requirements", "eligible", "qualify"],
      },
    ],
  },
  {
    id: "admin-tools",
    title: "Admin Tools",
    icon: "🔧",
    description: "Administrative functions and management",
    questions: [
      {
        id: "user-approvals",
        question: "How do I approve new user registrations?",
        answer: `**Admin Only**

To approve users:

1. Go to the **Dashboard**
2. Click **Admin Approval Quick Access** or go to Settings
3. View pending user registrations
4. For each user, review their details:
   - Name, Email, Matric Number, Faculty
5. Click **Approve** to verify the user
6. The user will receive an email notification

**Tips:**
- Verify the email domain matches your institution
- Check matric numbers are in the correct format
- Approved users can immediately access the platform`,
        adminOnly: true,
        keywords: ["approve", "users", "verify", "registration", "admin"],
      },
      {
        id: "admin-dashboard",
        question: "What can I see on the Admin Dashboard?",
        answer: `**Admin Only**

The Admin Dashboard shows:

**Quick Stats:**
- Total registered users
- Pending approvals
- Active events
- Recent attendance

**Quick Actions:**
- Create new event
- View approvals
- Access reports

**Event Calendar:**
- All events with registration status
- Click dates to view events

**Recent Activity:**
- Latest registrations
- Recent check-ins
- New feedback submissions`,
        adminOnly: true,
        keywords: ["dashboard", "admin", "overview", "stats"],
      },
      {
        id: "analytics-reports",
        question: "How do I access Analytics & Reports?",
        answer: `**Admin Only**

To access analytics:

1. Click **Analytics & Reports** in the sidebar
2. View comprehensive reports:

**User Insights:**
- Total users and growth
- Faculty distribution
- Pending approvals

**Event Operations:**
- Total events held
- Event status breakdown
- Attendance rates

**Attendance Engagement:**
- Participation rates
- Check-in methods used
- Faculty attendance comparison

**Trends:**
- Registrations vs attendance over time
- Top performing events

**Exporting:**
Click **Export** to download reports as Excel files.`,
        adminOnly: true,
        keywords: ["analytics", "reports", "insights", "statistics", "admin"],
      },
    ],
  },
];

/**
 * Search help content
 */
export function searchHelp(query: string): HelpQuestion[] {
  const searchTerms = query.toLowerCase().split(" ").filter(Boolean);
  
  if (searchTerms.length === 0) return [];

  const results: { question: HelpQuestion; score: number }[] = [];

  helpCategories.forEach((category) => {
    category.questions.forEach((q) => {
      let score = 0;
      const searchableText = `${q.question} ${q.answer} ${q.keywords.join(" ")}`.toLowerCase();

      searchTerms.forEach((term) => {
        // Exact keyword match = higher score
        if (q.keywords.some((kw) => kw.toLowerCase().includes(term))) {
          score += 3;
        }
        // Question match
        if (q.question.toLowerCase().includes(term)) {
          score += 2;
        }
        // Answer match
        if (q.answer.toLowerCase().includes(term)) {
          score += 1;
        }
      });

      if (score > 0) {
        results.push({ question: q, score });
      }
    });
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.map((r) => r.question);
}

/**
 * Get all questions (flat list)
 */
export function getAllQuestions(): HelpQuestion[] {
  return helpCategories.flatMap((category) => category.questions);
}
