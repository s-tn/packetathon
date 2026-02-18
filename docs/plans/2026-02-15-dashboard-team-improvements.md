# Dashboard & Team Management Improvements - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add admin team management, per-school team creation control, dashboard UX improvements, and hover effect fixes.

**Architecture:** Extend existing Prisma schema with `allowTeamCreation` boolean on School. Add team CRUD actions to existing admin and school-admin route handlers. Update frontend components (Dashboard, AdminManage, SchoolAdminDashboard) with role-aware home page, team management tabs, and consistent hover styles.

**Tech Stack:** SolidJS, TailwindCSS, Kobalte UI, Prisma/SQLite, Vite dev server with custom route plugin

---

### Task 1: Schema — Add `allowTeamCreation` to School

**Files:**
- Modify: `prisma/schema.prisma:82-89`

**Step 1: Add the field**

In `prisma/schema.prisma`, add `allowTeamCreation` to the School model (after `allowSelfRegistration` on line 87):

```prisma
model School {
  id    Int    @id @default(autoincrement())
  value String @unique
  label String
  majors Major[]
  allowSelfRegistration Boolean @default(true)
  allowTeamCreation Boolean @default(true)
  admins SchoolAdmin[]
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add-allow-team-creation
```

Expected: Migration applied successfully, new column added to School table.

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "schema: add allowTeamCreation to School model"
```

---

### Task 2: Seed Data — Set Applied Tech `allowTeamCreation: false`

**Files:**
- Modify: `server/seed.ts:224-228`

**Step 1: Update seed**

In `server/seed.ts`, find the block that sets Applied Tech `allowSelfRegistration: false` (around line 225-228) and add `allowTeamCreation`:

```typescript
      // Set Applied Tech to disallow self-registration
      await prisma.school.update({
        where: { id: atSchool.id },
        data: { allowSelfRegistration: false, allowTeamCreation: false },
      });
```

**Step 2: Re-seed the database**

```bash
rm prisma/dev.db
npx prisma migrate dev
```

Expected: Console prints "Test accounts seeded" with all 5 accounts. Applied Tech has both `allowSelfRegistration: false` and `allowTeamCreation: false`.

**Step 3: Commit**

```bash
git add server/seed.ts
git commit -m "seed: set Applied Tech allowTeamCreation to false"
```

---

### Task 3: Backend — Extend PATCH `/api/schools` for `allowTeamCreation`

**Files:**
- Modify: `server/routes/data.ts:22-26`

**Step 1: Update PATCH handler**

In `server/routes/data.ts`, modify the PATCH handler (lines 22-26) to accept both fields:

Find:
```typescript
        const { id, allowSelfRegistration } = req.body;
        try {
          await prisma.school.update({
            where: { id },
            data: { allowSelfRegistration },
          });
```

Replace with:
```typescript
        const { id, allowSelfRegistration, allowTeamCreation } = req.body;
        const updateData: any = {};
        if (allowSelfRegistration !== undefined) updateData.allowSelfRegistration = allowSelfRegistration;
        if (allowTeamCreation !== undefined) updateData.allowTeamCreation = allowTeamCreation;
        try {
          await prisma.school.update({
            where: { id },
            data: updateData,
          });
```

**Step 2: Verify**

Start dev server (`npm run dev`), log in as admin, PATCH a school with `allowTeamCreation` via the browser console:
```js
fetch('/api/schools', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: 1, allowTeamCreation: false}) }).then(r=>r.json()).then(console.log)
```
Expected: `{ success: true }`

**Step 3: Commit**

```bash
git add server/routes/data.ts
git commit -m "api: extend PATCH /api/schools for allowTeamCreation"
```

---

### Task 4: Backend — Add `allowTeamCreation` to `/api/user` Response

**Files:**
- Modify: `server/routes/user.ts:10-61`

**Step 1: Look up school and include `allowTeamCreation`**

In `server/routes/user.ts`, inside the `/api/user` handler, after the `isSchoolAdmin`/`adminSchools` block (after line 37), add:

```typescript
            // Include school's allowTeamCreation flag
            const userSchool = await prisma.school.findUnique({ where: { value: user.school } });
            (user as any).allowTeamCreation = userSchool?.allowTeamCreation ?? true;
```

This goes right after the line `(user as any).adminSchools = schoolAdminAssignments.map(a => a.school);` (line 37) and before the `if ((user as any).team)` block (line 38).

**Step 2: Verify**

Log in as Carol (Applied Tech student), open browser console:
```js
fetch('/api/user').then(r=>r.json()).then(d=>console.log(d.user.allowTeamCreation))
```
Expected: `false` (since Applied Tech has `allowTeamCreation: false` from seed)

**Step 3: Commit**

```bash
git add server/routes/user.ts
git commit -m "api: include allowTeamCreation in /api/user response"
```

---

### Task 5: Backend — Route Guards on `/api/createteam` and `/api/join`

**Files:**
- Modify: `server/routes/teams.ts:31-44` and `server/routes/teams.ts:94-106`

**Step 1: Add `allowTeamCreation` check to `/api/createteam`**

In `server/routes/teams.ts`, inside the `/api/createteam` handler, after the user verification check (after line 44 `return;`), add:

```typescript
      // Check if student's school allows team creation
      const userSchool = await prisma.school.findUnique({ where: { value: user.school } });
      if (userSchool && !userSchool.allowTeamCreation && !user.admin) {
        const isSchoolAdmin = await prisma.schoolAdmin.findFirst({ where: { userId: user.id } });
        if (!isSchoolAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Team creation is managed by your school administrator' }));
          return;
        }
      }
```

Insert this block right after line 44 (`return;` after the `!user.verified` check) and before line 45 (`const team = await prisma.team.create`).

**Step 2: Add `allowTeamCreation` check to `/api/join`**

In the `/api/join` handler, after the user verification check (after line 106 `return;`), add the same guard:

```typescript
      // Check if student's school allows team creation
      const userSchool = await prisma.school.findUnique({ where: { value: user.school } });
      if (userSchool && !userSchool.allowTeamCreation && !user.admin) {
        const isSchoolAdmin = await prisma.schoolAdmin.findFirst({ where: { userId: user.id } });
        if (!isSchoolAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Team joining is managed by your school administrator' }));
          return;
        }
      }
```

Insert this after line 106 (`return;` after `!user.verified`) and before line 107 (`const team = await prisma.team.findUnique`).

**Step 3: Verify**

Log in as Carol (AT student). Try to create a team via console:
```js
fetch('/api/createteam', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name:'Test',project:'Test',categories:'[]',experience:'beginner',maxSize:'2'}) }).then(r=>r.json()).then(console.log)
```
Expected: `{ error: 'Team creation is managed by your school administrator' }` with 403 status.

**Step 4: Commit**

```bash
git add server/routes/teams.ts
git commit -m "api: guard createteam and join with allowTeamCreation check"
```

---

### Task 6: Backend — Admin Team Management Actions

**Files:**
- Modify: `server/routes/admin.ts:90-108`

**Step 1: Expand `/api/admin/teams` POST handler**

In `server/routes/admin.ts`, replace the POST handler body inside the `else if (req.method === 'POST')` block (lines 90-108) with:

```typescript
      } else if (req.method === 'POST') {
        const { action, teamId, data } = req.body;

        try {
          if (action === 'delete') {
            if (!teamId) return res.writeHead(400).end();
            await prisma.request.deleteMany({ where: { teamId } });
            await prisma.registration.updateMany({
              where: { teamId },
              data: { teamId: null, status: 2 }
            });
            await prisma.team.delete({ where: { id: teamId } });
          } else if (action === 'create') {
            const { name, project, leaderId, maxSize, experience, categories } = data || {};
            if (!name || !project || !leaderId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'name, project, and leaderId are required' }));
            }
            const team = await prisma.team.create({
              data: {
                name,
                project,
                leaderId,
                maxSize: (maxSize || '4').toString(),
                experience: experience || 'beginner',
                categories: categories || '[]',
                members: { connect: { id: leaderId } },
              },
            });
            await prisma.registration.updateMany({
              where: { userId: leaderId, teamId: null },
              data: { teamId: team.id, status: 1 },
            });
          } else if (action === 'edit') {
            if (!teamId) return res.writeHead(400).end();
            const { name, project, maxSize, experience, categories } = data || {};
            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (project !== undefined) updateData.project = project;
            if (maxSize !== undefined) updateData.maxSize = maxSize.toString();
            if (experience !== undefined) updateData.experience = experience;
            if (categories !== undefined) updateData.categories = categories;
            await prisma.team.update({ where: { id: teamId }, data: updateData });
          } else if (action === 'add-member') {
            if (!teamId) return res.writeHead(400).end();
            const { userId } = data || {};
            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'userId required' }));
            }
            const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
            if (!team) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Team not found' }));
            }
            if (team.members.length >= parseInt(team.maxSize)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Team is full' }));
            }
            if (team.members.some(m => m.id === userId)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'User already on team' }));
            }
            await prisma.team.update({
              where: { id: teamId },
              data: { members: { connect: { id: userId } } },
            });
            await prisma.registration.updateMany({
              where: { userId, teamId: null },
              data: { teamId, status: 1 },
            });
            // Clean up any pending requests from this user
            await prisma.request.deleteMany({ where: { userId } });
          } else if (action === 'remove-member') {
            if (!teamId) return res.writeHead(400).end();
            const { userId } = data || {};
            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'userId required' }));
            }
            await prisma.team.update({
              where: { id: teamId },
              data: { members: { disconnect: { id: userId } } },
            });
            await prisma.registration.updateMany({
              where: { userId, teamId },
              data: { teamId: null, status: 2 },
            });
          }
          res.writeHead(200).end(JSON.stringify({ success: true }));
        } catch (e) {
          console.error(e);
          res.writeHead(500).end(JSON.stringify({ error: 'Action failed' }));
        }
      }
```

**Step 2: Commit**

```bash
git add server/routes/admin.ts
git commit -m "api: add create/edit/add-member/remove-member to admin teams"
```

---

### Task 7: Backend — School Admin Team Management Endpoints

**Files:**
- Modify: `server/routes/school-admin.ts:267-270` (add new routes before the closing `];`)

**Step 1: Add team endpoints**

In `server/routes/school-admin.ts`, add these new route objects before the closing `];` on line 268 (after the register endpoint closing `},` on line 267):

```typescript
  {
    path: '/api/school-admin/teams',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { school } = req.body;
      if (!school) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School value required' }));
      }

      const schoolRecord = await prisma.school.findUnique({ where: { value: school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      // Get teams with at least one member from this school
      const teams = await prisma.team.findMany({
        where: {
          members: { some: { school } },
        },
        include: {
          members: { select: { id: true, name: true, email: true, school: true } },
          leader: { select: { id: true, name: true, email: true } },
          requests: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { id: 'desc' },
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ teams }));
    },
  },
  {
    path: '/api/school-admin/team/manage',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { action, school, teamId, data } = req.body;
      if (!school) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School value required' }));
      }

      const schoolRecord = await prisma.school.findUnique({ where: { value: school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      try {
        if (action === 'create') {
          const { name, project, leaderId, maxSize, experience, categories } = data || {};
          if (!name || !project || !leaderId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'name, project, and leaderId required' }));
          }
          // Verify leader belongs to this school
          const leader = await prisma.user.findUnique({ where: { id: leaderId } });
          if (!leader || leader.school !== school) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Leader must belong to this school' }));
          }
          const team = await prisma.team.create({
            data: {
              name,
              project,
              leaderId,
              maxSize: (maxSize || '4').toString(),
              experience: experience || 'beginner',
              categories: categories || '[]',
              members: { connect: { id: leaderId } },
            },
          });
          await prisma.registration.updateMany({
            where: { userId: leaderId, teamId: null },
            data: { teamId: team.id, status: 1 },
          });
        } else if (action === 'edit') {
          if (!teamId) return res.writeHead(400).end();
          const { name, project, maxSize, experience, categories } = data || {};
          const updateData: any = {};
          if (name !== undefined) updateData.name = name;
          if (project !== undefined) updateData.project = project;
          if (maxSize !== undefined) updateData.maxSize = maxSize.toString();
          if (experience !== undefined) updateData.experience = experience;
          if (categories !== undefined) updateData.categories = categories;
          await prisma.team.update({ where: { id: teamId }, data: updateData });
        } else if (action === 'add-member') {
          if (!teamId) return res.writeHead(400).end();
          const { userId } = data || {};
          if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'userId required' }));
          }
          // Verify student belongs to this school
          const student = await prisma.user.findUnique({ where: { id: userId } });
          if (!student || student.school !== school) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Student must belong to this school' }));
          }
          const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
          if (!team) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Team not found' }));
          }
          if (team.members.length >= parseInt(team.maxSize)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Team is full' }));
          }
          if (team.members.some(m => m.id === userId)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'User already on team' }));
          }
          await prisma.team.update({
            where: { id: teamId },
            data: { members: { connect: { id: userId } } },
          });
          await prisma.registration.updateMany({
            where: { userId, teamId: null },
            data: { teamId, status: 1 },
          });
          await prisma.request.deleteMany({ where: { userId } });
        } else if (action === 'remove-member') {
          if (!teamId) return res.writeHead(400).end();
          const { userId } = data || {};
          if (!userId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'userId required' }));
          }
          await prisma.team.update({
            where: { id: teamId },
            data: { members: { disconnect: { id: userId } } },
          });
          await prisma.registration.updateMany({
            where: { userId, teamId },
            data: { teamId: null, status: 2 },
          });
        } else if (action === 'delete') {
          if (!teamId) return res.writeHead(400).end();
          await prisma.request.deleteMany({ where: { teamId } });
          await prisma.registration.updateMany({
            where: { teamId },
            data: { teamId: null, status: 2 },
          });
          await prisma.team.delete({ where: { id: teamId } });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Action failed' }));
      }
    },
  },
```

**Step 2: Commit**

```bash
git add server/routes/school-admin.ts
git commit -m "api: add team management endpoints for school admins"
```

---

### Task 8: Frontend — Schools Tab `allowTeamCreation` Toggle

**Files:**
- Modify: `src/components/AdminManage.jsx:146-188`

**Step 1: Add Team Creation toggle column**

In `src/components/AdminManage.jsx`, modify the Schools tab table. After the "Self-Registration" TableHead (line 150), add:

```jsx
<TableHead>Team Creation</TableHead>
```

After the Self-Registration `<TableCell>` block (after line 167, closing `</TableCell>`), add a new TableCell:

```jsx
                                    <TableCell>
                                        <Button size="sm" variant={school.allowTeamCreation ? "outline" : "destructive"} onClick={() => {
                                            fetch('/api/schools', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: school.id, allowTeamCreation: !school.allowTeamCreation })
                                            }).then(() => fetchSchools());
                                        }}>{school.allowTeamCreation ? 'Enabled' : 'Disabled'}</Button>
                                    </TableCell>
```

**Step 2: Verify**

Log in as admin, go to Admin > Manage System > Schools tab. You should see a "Team Creation" column with Enabled/Disabled toggle buttons next to Self-Registration.

**Step 3: Commit**

```bash
git add src/components/AdminManage.jsx
git commit -m "ui: add Team Creation toggle to admin Schools tab"
```

---

### Task 9: Frontend — Enhanced Admin Teams Tab

**Files:**
- Modify: `src/components/AdminManage.jsx:324-358`

**Step 1: Replace the Teams tab content**

In `src/components/AdminManage.jsx`, replace the entire `<TabsContent value="teams">` block (lines 324-358) with:

```jsx
                <TabsContent value="teams" class="space-y-4">
                    {/* Create Team Form */}
                    <Card class="border-zinc-700">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-lg">Create Team</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const leaderVal = adminTeamLeader();
                                if (!leaderVal) { alert('Select a team leader'); return; }
                                fetch('/api/admin/teams', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'create',
                                        data: {
                                            name: formData.get('teamName'),
                                            project: formData.get('teamProject'),
                                            leaderId: leaderVal.id,
                                            maxSize: formData.get('teamMaxSize') || '4',
                                            experience: 'beginner',
                                            categories: '[]',
                                        }
                                    })
                                }).then(r => r.json()).then(d => {
                                    if (d.success) { fetchTeams(); e.target.reset(); setAdminTeamLeader(null); }
                                    else alert(d.error || 'Failed to create team');
                                });
                            }} class="flex flex-wrap gap-2 items-end">
                                <TextFieldRoot class="flex-1 min-w-[150px]">
                                    <TextFieldLabel>Team Name</TextFieldLabel>
                                    <TextField name="teamName" required class="p-2" placeholder="Team name" />
                                </TextFieldRoot>
                                <TextFieldRoot class="flex-1 min-w-[150px]">
                                    <TextFieldLabel>Project</TextFieldLabel>
                                    <TextField name="teamProject" required class="p-2" placeholder="Project description" />
                                </TextFieldRoot>
                                <Select
                                    options={users().filter(u => !u.admin && u.verified)}
                                    optionValue="id"
                                    optionTextValue="name"
                                    placeholder="Select Leader"
                                    onChange={setAdminTeamLeader}
                                    itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.name} ({props.item.rawValue.email})</SelectItem>}
                                >
                                    <SelectTrigger class="w-[200px]">
                                        <SelectValue>{state => state.selectedOption()?.name || 'Select Leader'}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent />
                                </Select>
                                <TextFieldRoot class="w-[80px]">
                                    <TextFieldLabel>Max</TextFieldLabel>
                                    <TextField name="teamMaxSize" type="number" min="1" max="4" value="4" class="p-2" />
                                </TextFieldRoot>
                                <Button type="submit">Create</Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Teams Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Name</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Leader</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Pending</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <For each={teams()}>{(team) => (
                                <>
                                    <TableRow
                                        class="cursor-pointer hover:bg-zinc-800"
                                        onClick={() => setExpandedTeamId(expandedTeamId() === team.id ? null : team.id)}
                                    >
                                        <TableCell>{team.name}</TableCell>
                                        <TableCell class="max-w-[200px] truncate">{team.project}</TableCell>
                                        <TableCell>{team.leader?.name || '-'}</TableCell>
                                        <TableCell>{team.members?.length || 0}/{team.maxSize}</TableCell>
                                        <TableCell>{team.requests?.length || 0}</TableCell>
                                        <TableCell class="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="destructive" size="sm" onClick={() => {
                                                if (!confirm(`Delete team "${team.name}"? All members will be removed.`)) return;
                                                fetch('/api/admin/teams', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'delete', teamId: team.id })
                                                }).then(() => fetchTeams());
                                            }}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                    {expandedTeamId() === team.id && (
                                        <TableRow class="bg-zinc-900">
                                            <TableCell colSpan={6}>
                                                <div class="p-4 space-y-3">
                                                    <div class="text-sm">
                                                        <span class="text-zinc-400">Members:</span>
                                                        <div class="mt-1 space-y-1">
                                                            <For each={team.members}>{(member) => (
                                                                <div class="flex items-center justify-between">
                                                                    <span>{member.name} ({member.email}) {member.id === team.leaderId && <span class="text-amber-400 text-xs ml-1">Leader</span>}</span>
                                                                    {member.id !== team.leaderId && (
                                                                        <Button size="sm" variant="outline" onClick={() => {
                                                                            if (!confirm(`Remove ${member.name} from ${team.name}?`)) return;
                                                                            fetch('/api/admin/teams', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ action: 'remove-member', teamId: team.id, data: { userId: member.id } })
                                                                            }).then(() => fetchTeams());
                                                                        }}>Remove</Button>
                                                                    )}
                                                                </div>
                                                            )}</For>
                                                        </div>
                                                    </div>
                                                    {team.members.length < parseInt(team.maxSize) && (
                                                        <div class="flex items-center gap-2">
                                                            <Select
                                                                options={users().filter(u => !u.admin && u.verified && !team.members.some(m => m.id === u.id))}
                                                                optionValue="id"
                                                                optionTextValue="name"
                                                                placeholder="Add member..."
                                                                onChange={(val) => {
                                                                    if (!val) return;
                                                                    fetch('/api/admin/teams', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ action: 'add-member', teamId: team.id, data: { userId: val.id } })
                                                                    }).then(() => fetchTeams());
                                                                }}
                                                                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>}
                                                            >
                                                                <SelectTrigger class="w-[200px]">
                                                                    <SelectValue>{state => state.selectedOption()?.name || 'Add member...'}</SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent />
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}</For>
                        </TableBody>
                    </Table>
                </TabsContent>
```

**Step 2: Add required signals**

At the top of the `AdminManage` component (after the existing signal declarations around line 33), add:

```jsx
    const [expandedTeamId, setExpandedTeamId] = createSignal(null);
    const [adminTeamLeader, setAdminTeamLeader] = createSignal(null);
```

Also add `Card, CardContent, CardHeader, CardTitle` to the imports at the top. Change:

```jsx
import { Button } from "@/components/ui/button";
```

to:

```jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

**Step 3: Commit**

```bash
git add src/components/AdminManage.jsx
git commit -m "ui: enhanced admin Teams tab with create, expand, add/remove members"
```

---

### Task 10: Frontend — School Admin Teams Tab

**Files:**
- Modify: `src/components/SchoolAdminDashboard.jsx`

**Step 1: Add teams state and fetch**

In `src/components/SchoolAdminDashboard.jsx`, add new signals after line 22 (`const [saving, setSaving] = createSignal(false);`):

```jsx
  const [saTeams, setSaTeams] = createSignal([]);
  const [saExpandedTeamId, setSaExpandedTeamId] = createSignal(null);
  const [saTeamLeader, setSaTeamLeader] = createSignal(null);
```

Add the `Tabs, TabsContent, TabsList, TabsTrigger, TabsIndicator` imports. Change the import block at the top to include:

```jsx
import { createSignal, createEffect, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField, TextFieldRoot, TextFieldLabel } from "@/components/ui/textfield";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabsIndicator
} from "@/components/ui/tabs";
```

Add a `fetchTeams` function after the `fetchStudents` function (around line 75):

```jsx
  const fetchTeams = () => {
    if (!selectedSchool()) return;
    fetch('/api/school-admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school: selectedSchool().value }),
    }).then(r => r.json()).then(data => {
      setSaTeams(data.teams || []);
    });
  };
```

Update the existing `createEffect` that fetches students (around line 61-65) to also fetch teams:

```jsx
  createEffect(() => {
    if (selectedSchool() && (view() === 'list')) {
      fetchStudents();
      fetchTeams();
    }
  });
```

**Step 2: Wrap the student list in tabs**

In the render, find the `<Show when={view() === 'list' && selectedSchool()}>` block (starts around line 219). Replace the entire content of that Show block with a tabbed layout:

```jsx
      <Show when={view() === 'list' && selectedSchool()}>
        <Tabs defaultValue="students" class="w-full">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsIndicator />
          </TabsList>

          <TabsContent value="students" class="space-y-4">
            <div class="flex flex-wrap gap-4 mb-4">
              <TextFieldRoot class="flex-1 min-w-[200px]">
                <TextField
                  placeholder="Search students by name or email..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.target.value)}
                  class="p-2"
                />
              </TextFieldRoot>
              <Button onClick={() => setView('register')}>Register Student</Button>
            </div>

            <div class="text-sm text-zinc-400 mb-2">
              Managing: <span class="font-semibold text-white">{selectedSchool().label}</span> - {filteredStudents().length} student{filteredStudents().length !== 1 ? 's' : ''}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={filteredStudents()} fallback={
                  <TableRow>
                    <TableCell colSpan={5} class="text-center text-zinc-400 py-8">
                      No students found
                    </TableCell>
                  </TableRow>
                }>{(student) => (
                  <TableRow class="cursor-pointer hover:bg-zinc-800" onClick={() => openEdit(student)}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.verified ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                )}</For>
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="teams" class="space-y-4">
            {/* Create Team */}
            <Card class="border-zinc-700">
              <CardHeader class="pb-2">
                <CardTitle class="text-lg">Create Team</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  if (!saTeamLeader()) { alert('Select a team leader'); return; }
                  fetch('/api/school-admin/team/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'create',
                      school: selectedSchool().value,
                      data: {
                        name: formData.get('teamName'),
                        project: formData.get('teamProject'),
                        leaderId: saTeamLeader().id,
                        maxSize: formData.get('teamMaxSize') || '4',
                        experience: 'beginner',
                        categories: '[]',
                      }
                    })
                  }).then(r => r.json()).then(d => {
                    if (d.success) { fetchTeams(); e.target.reset(); setSaTeamLeader(null); }
                    else alert(d.error || 'Failed');
                  });
                }} class="flex flex-wrap gap-2 items-end">
                  <TextFieldRoot class="flex-1 min-w-[150px]">
                    <TextFieldLabel>Team Name</TextFieldLabel>
                    <TextField name="teamName" required class="p-2" placeholder="Team name" />
                  </TextFieldRoot>
                  <TextFieldRoot class="flex-1 min-w-[150px]">
                    <TextFieldLabel>Project</TextFieldLabel>
                    <TextField name="teamProject" required class="p-2" placeholder="Project description" />
                  </TextFieldRoot>
                  <Select
                    options={students().filter(s => s.verified && !s.teams?.length)}
                    optionValue="id"
                    optionTextValue="name"
                    placeholder="Select Leader"
                    onChange={setSaTeamLeader}
                    itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>}
                  >
                    <SelectTrigger class="w-[200px]">
                      <SelectValue>{state => state.selectedOption()?.name || 'Select Leader'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                  <TextFieldRoot class="w-[80px]">
                    <TextFieldLabel>Max</TextFieldLabel>
                    <TextField name="teamMaxSize" type="number" min="1" max="4" value="4" class="p-2" />
                  </TextFieldRoot>
                  <Button type="submit">Create</Button>
                </form>
              </CardContent>
            </Card>

            {/* Teams Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={saTeams()} fallback={
                  <TableRow>
                    <TableCell colSpan={5} class="text-center text-zinc-400 py-8">No teams found</TableCell>
                  </TableRow>
                }>{(team) => (
                  <>
                    <TableRow
                      class="cursor-pointer hover:bg-zinc-800"
                      onClick={() => setSaExpandedTeamId(setSaExpandedTeamId() === team.id ? null : team.id)}
                    >
                      <TableCell>{team.name}</TableCell>
                      <TableCell class="max-w-[200px] truncate">{team.project}</TableCell>
                      <TableCell>{team.leader?.name || '-'}</TableCell>
                      <TableCell>{team.members?.length || 0}/{team.maxSize}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="destructive" size="sm" onClick={() => {
                          if (!confirm(`Delete team "${team.name}"?`)) return;
                          fetch('/api/school-admin/team/manage', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'delete', school: selectedSchool().value, teamId: team.id })
                          }).then(() => fetchTeams());
                        }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                    {saExpandedTeamId() === team.id && (
                      <TableRow class="bg-zinc-900">
                        <TableCell colSpan={5}>
                          <div class="p-4 space-y-3">
                            <div class="text-sm">
                              <span class="text-zinc-400">Members:</span>
                              <div class="mt-1 space-y-1">
                                <For each={team.members}>{(member) => (
                                  <div class="flex items-center justify-between">
                                    <span>{member.name} ({member.email}) {member.id === team.leaderId && <span class="text-amber-400 text-xs ml-1">Leader</span>}</span>
                                    {member.id !== team.leaderId && (
                                      <Button size="sm" variant="outline" onClick={() => {
                                        if (!confirm(`Remove ${member.name}?`)) return;
                                        fetch('/api/school-admin/team/manage', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ action: 'remove-member', school: selectedSchool().value, teamId: team.id, data: { userId: member.id } })
                                        }).then(() => fetchTeams());
                                      }}>Remove</Button>
                                    )}
                                  </div>
                                )}</For>
                              </div>
                            </div>
                            {team.members.length < parseInt(team.maxSize) && (
                              <div class="flex items-center gap-2">
                                <Select
                                  options={students().filter(s => s.verified && !team.members.some(m => m.id === s.id))}
                                  optionValue="id"
                                  optionTextValue="name"
                                  placeholder="Add member..."
                                  onChange={(val) => {
                                    if (!val) return;
                                    fetch('/api/school-admin/team/manage', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'add-member', school: selectedSchool().value, teamId: team.id, data: { userId: val.id } })
                                    }).then(() => fetchTeams());
                                  }}
                                  itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>}
                                >
                                  <SelectTrigger class="w-[200px]">
                                    <SelectValue>{state => state.selectedOption()?.name || 'Add member...'}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent />
                                </Select>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}</For>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Show>
```

**Step 3: Commit**

```bash
git add src/components/SchoolAdminDashboard.jsx
git commit -m "ui: add Teams tab to School Admin Dashboard"
```

---

### Task 11: Frontend — Dashboard Home Page Improvements

**Files:**
- Modify: `src/Dashboard.jsx:374-420`

**Step 1: Replace the home page**

In `src/Dashboard.jsx`, replace the `'/'` page entry (lines 374-420) with:

```jsx
    '/': () => (
      <>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome to the 2026 Bergen Tech Hackathon!</h2>
          <p className="text-gray-500 mb-6">Manage your registration, team, and hackathon details below.</p>
          <div className="flex flex-col items-center gap-4">
            {/* Super Admin */}
            {user().admin && (
              <div className="w-full max-w-md space-y-3">
                <Button onClick={() => setPage('/admin')} class="w-full">Admin Dashboard</Button>
                {user().isSchoolAdmin && (
                  <Button onClick={() => setPage('/school-admin')} class="w-full" variant="outline">School Admin Dashboard</Button>
                )}
              </div>
            )}

            {/* School Admin (not super admin) */}
            {!user().admin && user().isSchoolAdmin && (
              <div className="w-full max-w-md space-y-3">
                <Button onClick={() => setPage('/school-admin')} class="w-full">School Admin Dashboard</Button>
              </div>
            )}

            {/* Student with team */}
            {!user().admin && !user().isSchoolAdmin && user().registration?.teamId && (
              <div className="w-full max-w-md space-y-3">
                {user().team ? (
                  <Card class="text-left">
                    <CardHeader class="pb-2">
                      <CardTitle class="text-lg">Your Team: {user().team.name}</CardTitle>
                      <CardDescription>{user().team.members?.length || 0} of {user().team.maxSize} members</CardDescription>
                    </CardHeader>
                    <CardContent class="pt-2">
                      <Button onClick={() => setPage('/team')} class="w-full">View Team</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-400">Your join request is pending approval.</p>
                    <Button onClick={() => {
                      if (!confirm("Cancel your join request?")) return;
                      fetch('/api/cancel-request', { method: 'POST' }).then(r => r.json()).then(d => {
                        if (d.message === 'Request cancelled') location.reload();
                        else alert('Error cancelling request');
                      });
                    }} variant="outline" class="w-full">Cancel Join Request</Button>
                  </div>
                )}
              </div>
            )}

            {/* Student without team */}
            {!user().admin && !user().isSchoolAdmin && !user().registration?.teamId && (
              <div className="w-full max-w-md space-y-3">
                {user().allowTeamCreation === false ? (
                  <Card class="text-left border-amber-600/30">
                    <CardContent class="pt-4">
                      <p className="text-sm text-amber-300">Team assignment for your school is managed by your school administrator. Contact them to be assigned to a team.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Button onClick={() => setPage('/create')} class="w-full">Create Team</Button>
                    <Button onClick={() => setPage('/join')} class="w-full" variant="outline">Join a Team</Button>
                  </>
                )}
              </div>
            )}

            <Button onClick={() => setPage('/manage')} variant="outline" class="mt-2">Manage Account</Button>
          </div>
        </div>
      </>
    ),
```

**Step 2: Verify**

- Log in as Alice (student with team): see team card with "View Team" button
- Log in as Carol (AT student, no team): see amber card about school admin managing teams
- Log in as admin: see "Admin Dashboard" button only
- Log in as school admin: see "School Admin Dashboard" button only

**Step 3: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "ui: role-aware dashboard home page with team status cards"
```

---

### Task 12: Frontend — Hover Effect Fixes

**Files:**
- Modify: `src/Dashboard.jsx` (multiple lines)
- Modify: `src/components/AdminManage.jsx` (minor)

**Step 1: Fix join team cards**

In `src/Dashboard.jsx`, find the `/join` page (around line 868). The team cards currently use `<Card class="w-auto md:col-span-1 p-3">`. These cards themselves don't need hover effects since only the Request button is interactive. Keep them as-is (no hover class on the Card).

**Step 2: Fix team view cards**

In the `/team` page (around line 753), the team info cards (`<Card class="w-auto lg:col-span-3">` and `<Card class="w-auto lg:col-span-2">`) are display-only. These are fine as-is — no hover needed.

**Step 3: Fix manage account back button**

In the `/manage` page (around line 1121-1124), the "Back" button navigates using `window.history.pushState` then `location.href = location.href`. Fix it to use the consistent `setPage`:

Find in the `/manage` page:
```jsx
              <Button onClick={() => {
                window.history.pushState({}, '', '/signup/dashboard/team');
                location.href = location.href;
              }}>Back</Button>
```

Replace with:
```jsx
              <Button onClick={() => setPage('/')}>Back</Button>
```

**Step 4: Fix create team back button**

In the `/create` page (around line 610-613), same issue. Find:
```jsx
            <Button onClick={() => {
              window.history.pushState({}, '', '/signup/dashboard/team');
              location.href = location.href;
            }}>Back</Button>
```

Replace with:
```jsx
            <Button onClick={() => setPage('/')}>Back</Button>
```

**Step 5: Fix edit team back button**

In the `/edit` page (around line 938-941), same issue. Find:
```jsx
            <Button onClick={() => {
              window.history.pushState({}, '', '/signup/dashboard/team');
              location.href = location.href;
            }}>Back</Button>
```

Replace with:
```jsx
            <Button onClick={() => setPage('/team')}>Back</Button>
```

**Step 6: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "ui: fix hover effects and navigation consistency"
```

---

### Task 13: Verify Everything Works

**Step 1: Delete DB and re-seed**

```bash
rm prisma/dev.db
npx prisma migrate dev
npm run dev
```

**Step 2: Test each role**

1. **Admin** (`admin@bthackathon.com` / `password123`):
   - Home page shows "Admin Dashboard" only (no Create/Join team)
   - Admin > Manage > Schools tab: both Self-Registration and Team Creation toggles visible
   - Admin > Manage > Teams tab: Create Team form, expandable rows, Add/Remove members work

2. **School Admin** (`schooladmin@appliedtech.bthackathon.com` / `password123`):
   - Home page shows "School Admin Dashboard" only (no Create/Join team)
   - School Admin Dashboard: Students tab and Teams tab
   - Teams tab: create team (scoped to AT students), add/remove members

3. **Alice** (`alice@student.bthackathon.com` / `password123`):
   - Home page shows team card "ByteBuilders" with View Team
   - Can view/edit team normally

4. **Carol** (`carol@student.bthackathon.com` / `password123`):
   - Home page shows amber message about school admin managing teams (AT has `allowTeamCreation: false`)
   - Cannot create team or join team via API (403)

5. **Toggle test**: As admin, enable Team Creation for Applied Tech. Log in as Carol — now sees Create/Join buttons.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete dashboard & team management improvements"
```

---

## Summary of All Tasks

| # | Task | Files |
|---|------|-------|
| 1 | Schema: add `allowTeamCreation` | `prisma/schema.prisma` |
| 2 | Seed: AT `allowTeamCreation: false` | `server/seed.ts` |
| 3 | API: PATCH schools accepts `allowTeamCreation` | `server/routes/data.ts` |
| 4 | API: `/api/user` includes `allowTeamCreation` | `server/routes/user.ts` |
| 5 | API: Route guards on createteam/join | `server/routes/teams.ts` |
| 6 | API: Admin team CRUD | `server/routes/admin.ts` |
| 7 | API: School admin team endpoints | `server/routes/school-admin.ts` |
| 8 | UI: Schools tab Team Creation toggle | `src/components/AdminManage.jsx` |
| 9 | UI: Enhanced admin Teams tab | `src/components/AdminManage.jsx` |
| 10 | UI: School admin Teams tab | `src/components/SchoolAdminDashboard.jsx` |
| 11 | UI: Dashboard home page per role | `src/Dashboard.jsx` |
| 12 | UI: Hover/navigation fixes | `src/Dashboard.jsx` |
| 13 | Verify everything | All files |
