# Hemlock Point - Demo Script

## 2026 Bergen Tech Hackathon Registration Platform

**Duration:** ~12 minutes
**URL:** http://localhost:5173 (or whichever port Vite assigns)
**Start command:** `npm run dev`

---

## Test Accounts

All accounts are auto-seeded on first run (empty database). Password for all: **`password123`**

| Role | Email | Notes |
|------|-------|-------|
| **Super Admin** | `admin@bthackathon.com` | Full system admin access |
| **AT School Admin** | `schooladmin@appliedtech.bthackathon.com` | School admin for Applied Tech |
| **Team Leader** | `alice@student.bthackathon.com` | Leader of "ByteBuilders" team (Bergen Tech) |
| **Team Member** | `bob@student.bthackathon.com` | Member of "ByteBuilders" team (Bergen Tech) |
| **Solo Student** | `carol@student.bthackathon.com` | No team, Applied Tech school |

To re-seed: delete `prisma/dev.db` and restart the dev server.

---

## Pre-Demo Setup

1. Run `npm run dev` and confirm the server is up
2. Check the console for "Test accounts seeded" on first run
3. Open the app in a browser - log in as Alice (team leader) for the student demo
4. Have a second browser/incognito window ready for other accounts
5. Have additional tabs ready for admin and school admin demos

---

## Part 1: Student Registration (3 min)

> "This is Hemlock Point, the registration platform for the 2026 Bergen Tech Hackathon. Let me walk through what a student sees when they sign up."

### Step 1 - Personal Info
- Fill in first/last name, email, phone
- Show the **school dropdown** (Bergen Tech, Applied Tech) and how **majors cascade** based on school
- **Select Applied Tech** to trigger the self-registration block: an amber warning card appears explaining that registration for Applied Tech is managed by school administrators, with a contact email
- **Switch back to Bergen Tech** - the warning disappears and registration can proceed normally
- Pick a grade and shirt size
- Add a parent/guardian - show that a second parent can be added dynamically

### Step 2 - Team Selection
- Show all three paths:
  - **Create a Team** - name it, describe the project, set max size (1-4), pick experience level, choose competition categories
  - **Join a Team** - search existing teams, see member count and leader
  - **Work Solo** - for students who want to participate independently

### Step 3 - Legal
- Accept terms and conditions (checkboxes)

### Step 4 - Review
- Show the review screen summarizing everything entered
- Point out that form progress is saved to localStorage so students don't lose work

### Step 5 - Account Creation
- Set email and password
- Submit registration
- Show the **email verification prompt** (6-digit code sent via SendGrid)

> "Students can't access the dashboard until they verify their email. There's a resend button with a cooldown timer to prevent spam."

---

## Part 2: Student Dashboard (3 min)

> "Once verified, students land on their dashboard."

### Home Page
- Show the welcome message and conditional buttons
- If the student created a team: show **View Team** button
- If solo: show **Create Team** and **Join a Team** buttons
- If the user is a school admin: show **School Admin Dashboard** button

### Team View (`/team`)
- Show team details: name, project, member list with contact info
- Competition categories displayed as badges
- If team leader: show the **join requests counter** and ability to remove members

### Join Flow
- Open a second browser as a different student
- Send a **join request** to the first student's team
- Switch back to the team leader - show the request appearing
- **Accept** the request - member joins the team
- Show how **reject** and **cancel request** work too

### Edit Team
- As team leader, edit the team name, project description, categories
- Show the max size validation (can't shrink below current member count)

---

## Part 3: School Admin Dashboard (3 min)

> "Applied Tech needs their own administrator who can manage students at their school. Let me show the school admin experience."

### Login as School Admin
- Log in as `schooladmin@appliedtech.bthackathon.com`
- On the home page, notice the **School Admin Dashboard** button (only visible to school admins)

### Student List
- Click into the dashboard - it auto-selects Applied Tech since this admin manages only one school
- Show the student list table: name, email, grade, verified status, created date
- **Search bar** filters students by name or email in real time
- Currently one student (Carol Kim) is listed under Applied Tech

### Register a Student
- Click **Register Student**
- Show the **amber banner**: "Registering student as administrator for Applied Tech. Student will be pre-verified."
- Fill out the form: student info, password, parent/guardian info
- Submit - student is created as **pre-verified** (no email verification needed)
- The admin stays logged in as themselves (session is not hijacked)
- Student immediately appears in the list

### Edit a Student
- Click on a student row to open the edit form
- Change a field (e.g., grade, shirt size)
- Save - changes are reflected immediately

> "School admins can only see and manage students at their assigned school. They can't access other schools or the global admin panel."

---

## Part 4: Super Admin Panel (3 min)

> "The super admin has full system access, including the ability to configure school admins and self-registration policies."

### Login as Admin
- Log in as `admin@bthackathon.com`

### Admin Dashboard (`/admin`)
- Show the **quick stats**: Total Users, Verified, Teams, Unverified
- Two main sections: Manage System and View Data

### System Management (`/admin/manage`)
Walk through each tab:

#### Schools Tab (New Features)
- Show the **Self-Registration** toggle column
  - Applied Tech shows **Disabled** (red) - click to toggle to Enabled
  - Bergen Tech shows **Enabled** (outline) - this is the default
- Show the **Admins** column displaying who is assigned as school admin
- Toggle Applied Tech self-registration back to Disabled

#### Users Tab (Enhanced)
- Search by name/email, filter by verification status or school
- Expand rows to see full details including **School Admin** assignments
- Show the **+ School Admin** dropdown on any user row
  - Assign a user as school admin for a specific school
  - In the expanded row, see the assignment with an **x** button to remove it
- **Verify/Unverify** a student manually
- **Promote** a user to super admin
- **Delete** a user account

#### Other Tabs
- **Teams** - view all teams with members and leaders, delete teams if needed
- **Majors** - add/remove majors per school
- **Categories** - add/remove competition categories

### Data Export
- Click **Export Team Data** - downloads CSV with team names, projects, categories, members
- Click **Export Signup Data** - downloads CSV with all student info
- Show the **Data Viewer** tab with interactive tables

---

## Part 5: Technical Overview (1 min)

> "For those interested in the stack..."

- **Frontend:** SolidJS with TailwindCSS and Kobalte UI components
- **Backend:** Vite plugin with modular route handlers
  - `server/routes/auth.ts` - authentication (login, register, verify, password reset)
  - `server/routes/teams.ts` - team CRUD and member management
  - `server/routes/admin.ts` - super admin user/team management
  - `server/routes/school-admin.ts` - school-scoped admin endpoints
  - `server/routes/data.ts` - schools, majors, categories (with self-registration toggle)
  - `server/routes/exports.ts` - CSV export
  - `server/routes/user.ts` - user profile and account deletion
- **Database:** Prisma ORM with SQLite (swappable to Postgres)
  - `SchoolAdmin` join table links users to schools for scoped admin access
- **Email:** SendGrid transactional emails for verification and password reset
- **Auth:** Session-based with bcrypt password hashing

---

## Key Talking Points

- **School-scoped administration** lets partner schools manage their own students without full system access
- **Self-registration control** per school - admins can lock down registration so only school admins can enroll students
- **Admin-initiated registration** bypasses email verification for students registered by their school
- Multi-step form with **localStorage persistence** so students don't lose progress
- **Team request workflow** gives team leaders control over who joins
- **Role-based access**: students see their dashboard, school admins manage their school, super admins see everything
- **CSV exports** let organizers pull data into spreadsheets for logistics
- **Email verification** ensures real student accounts
- **Rate limiting** on verification/reset code resends prevents abuse

---

## Demo Flow Cheat Sheet

| Step | Account | What to Show |
|------|---------|-------------|
| 1 | (new registration) | Registration form, Applied Tech self-reg block, Bergen Tech works |
| 2 | `alice@student.bthackathon.com` | Student dashboard, team view, join requests |
| 3 | `schooladmin@appliedtech.bthackathon.com` | School admin dashboard, register student, edit student |
| 4 | `admin@bthackathon.com` | Super admin: self-reg toggle, assign school admins, data export |
