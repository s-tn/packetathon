# Dashboard & Team Management Improvements Design

**Date:** 2026-02-15
**Status:** Proposed

## Problem Statement

Several UX and functionality gaps need addressing:
1. Admins (super + school) cannot manage teams from their dashboards
2. Students at schools where team creation should be restricted can still create/join teams
3. Hover effects on various UI elements feel inconsistent
4. Dashboard home page uses placeholder text and doesn't adapt well per user role
5. Admin users could theoretically access student team create/join flows

## Design

### Schema Change

Add `allowTeamCreation Boolean @default(true)` to the `School` model in `prisma/schema.prisma`. This controls whether students at that school can create or join teams on their own. When disabled, only admins can assign students to teams.

### Admin Team Management

**Super Admin (AdminManage.jsx - Teams tab):**
- Add "Create Team" form: team name, project description, leader (select from users), max size, experience, categories
- Add per-row: Edit button (inline editing), Add Member dropdown, expanded view with Remove Member buttons
- New admin API endpoints: `POST /api/admin/teams` actions: `create`, `edit`, `add-member`, `remove-member`

**School Admin (SchoolAdminDashboard.jsx):**
- Add "Teams" tab showing teams with at least one member from admin's school
- Create/edit/add/remove member capabilities scoped to their school's students
- New endpoints: `POST /api/school-admin/teams` (list), `POST /api/school-admin/team/create`, `POST /api/school-admin/team/update`, `POST /api/school-admin/team/add-member`, `POST /api/school-admin/team/remove-member`

### Dashboard Home Page

- Replace lorem ipsum with brief welcome message
- Students: show team status card. If `allowTeamCreation` is false for their school, hide Create/Join buttons and show info message
- School admins: show quick stats (students, teams) and prominent dashboard button
- Super admins: show Admin Dashboard button, no team create/join buttons

### Hover Effect Fixes

- Consistent `hover:bg-zinc-800` on interactive table rows with proper cursor
- Remove unintended hover effects on non-interactive cards
- Ensure outline button hover states are uniform
- Join team cards: only the Request button should have strong hover emphasis

### Route Guards

- `POST /api/createteam` and `POST /api/join`: check user's school `allowTeamCreation`. Return 403 if disabled. Skip check for admin-initiated actions.
- Frontend: check `allowTeamCreation` from user data, conditionally render team buttons

### Schools Tab Enhancement

- Add "Team Creation" toggle column in AdminManage Schools tab
- Extend PATCH `/api/schools` handler to accept `allowTeamCreation`

### Seed Data

- Applied Tech: `allowTeamCreation: false`
- Bergen Tech: `allowTeamCreation: true` (default)

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `allowTeamCreation` to School |
| `server/seed.ts` | Set AT `allowTeamCreation: false` |
| `server/routes/admin.ts` | Add team create/edit/add-member/remove-member actions |
| `server/routes/school-admin.ts` | Add team management endpoints |
| `server/routes/teams.ts` | Add `allowTeamCreation` check to createteam/join |
| `server/routes/data.ts` | Extend PATCH for `allowTeamCreation` |
| `server/routes/user.ts` | Include `allowTeamCreation` in user response |
| `src/components/AdminManage.jsx` | Enhance Teams tab, add Team Creation toggle to Schools tab |
| `src/components/SchoolAdminDashboard.jsx` | Add Teams tab |
| `src/Dashboard.jsx` | Improve home page per role, guard team buttons, fix hover effects |
