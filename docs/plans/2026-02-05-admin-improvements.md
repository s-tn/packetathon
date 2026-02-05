# Admin Panel Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the admin panel with search/filters, expandable user details, teams management, and registration stats.

**Architecture:** Frontend-only changes to AdminManage.jsx with one new backend endpoint for admin team management. Uses existing Prisma schema and UI components.

**Tech Stack:** Solid.js, existing UI components (Table, TextField, Select, Button, Tabs)

---

## Task 1: Add Stats Header to Admin Panel

**Files:**
- Modify: `src/components/AdminManage.jsx`

**Step 1: Add stats signals and computed values**

At the top of the component, after existing signals, add:

```jsx
const [teams, setTeams] = createSignal([]);

const fetchTeams = () => {
    fetch('/api/teams').then(res => res.json()).then(data => {
        setTeams(data.teams);
    });
};

// Add fetchTeams() to the createEffect
```

**Step 2: Add stats display above tabs**

Insert before the `<Tabs>` component:

```jsx
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-zinc-900 rounded-lg">
    <div class="text-center">
        <div class="text-2xl font-bold">{users().length}</div>
        <div class="text-sm text-zinc-400">Total Users</div>
    </div>
    <div class="text-center">
        <div class="text-2xl font-bold">{users().filter(u => u.verified).length}</div>
        <div class="text-sm text-zinc-400">Verified</div>
    </div>
    <div class="text-center">
        <div class="text-2xl font-bold">{teams().length}</div>
        <div class="text-sm text-zinc-400">Teams</div>
    </div>
    <div class="text-center">
        <div class="text-2xl font-bold">{users().filter(u => !u.verified).length}</div>
        <div class="text-sm text-zinc-400">Unverified</div>
    </div>
</div>
```

**Step 3: Verify stats display**

Run dev server and check admin panel shows 4 stat boxes with correct counts.

---

## Task 2: Add Search and Filters to Users Tab

**Files:**
- Modify: `src/components/AdminManage.jsx`

**Step 1: Add filter state signals**

After the existing signals, add:

```jsx
const [searchQuery, setSearchQuery] = createSignal('');
const [filterVerified, setFilterVerified] = createSignal('all'); // 'all', 'yes', 'no'
const [filterSchool, setFilterSchool] = createSignal('all');
const [filterHasTeam, setFilterHasTeam] = createSignal('all'); // 'all', 'yes', 'no'
```

**Step 2: Add filtered users computed function**

```jsx
const filteredUsers = () => {
    return users().filter(u => {
        // Search filter (name or email)
        const query = searchQuery().toLowerCase();
        if (query && !u.name?.toLowerCase().includes(query) && !u.email?.toLowerCase().includes(query)) {
            return false;
        }
        // Verified filter
        if (filterVerified() === 'yes' && !u.verified) return false;
        if (filterVerified() === 'no' && u.verified) return false;
        // School filter
        if (filterSchool() !== 'all' && u.school !== filterSchool()) return false;
        // Has team filter - requires team data on user (will add in backend update)
        return true;
    });
};
```

**Step 3: Add search bar and filter dropdowns above users table**

Inside `<TabsContent value="users">`, add before the Table:

```jsx
<div class="flex flex-wrap gap-4 mb-4">
    <TextFieldRoot class="flex-1 min-w-[200px]">
        <TextField
            placeholder="Search by name or email..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.target.value)}
            class="p-2"
        />
    </TextFieldRoot>
    <Select
        options={[
            { value: 'all', label: 'All Verified' },
            { value: 'yes', label: 'Verified' },
            { value: 'no', label: 'Unverified' }
        ]}
        optionValue="value"
        optionTextValue="label"
        value={filterVerified()}
        onChange={(val) => setFilterVerified(val?.value || 'all')}
        itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
    >
        <SelectTrigger class="w-[150px]">
            <SelectValue>{state => state.selectedOption()?.label || 'All Verified'}</SelectValue>
        </SelectTrigger>
        <SelectContent />
    </Select>
    <Select
        options={[{ value: 'all', label: 'All Schools' }, ...schools().map(s => ({ value: s.value, label: s.label }))]}
        optionValue="value"
        optionTextValue="label"
        value={filterSchool()}
        onChange={(val) => setFilterSchool(val?.value || 'all')}
        itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
    >
        <SelectTrigger class="w-[150px]">
            <SelectValue>{state => state.selectedOption()?.label || 'All Schools'}</SelectValue>
        </SelectTrigger>
        <SelectContent />
    </Select>
</div>
```

**Step 4: Update table to use filteredUsers()**

Change `<For each={users()}>` to `<For each={filteredUsers()}>`.

**Step 5: Verify filters work**

Test search by typing a name, test verified dropdown, test school dropdown.

---

## Task 3: Add Expandable User Details

**Files:**
- Modify: `src/components/AdminManage.jsx`

**Step 1: Add expanded state**

```jsx
const [expandedUserId, setExpandedUserId] = createSignal(null);
```

**Step 2: Update backend to return team info with users**

Modify `vite-plugin-auth.ts` at `/api/admin/users` GET handler:

```typescript
const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
    include: {
        teams: {
            select: { id: true, name: true }
        }
    }
});
```

**Step 3: Add click handler and expanded row**

Update the TableRow to be clickable and show details:

```jsx
<For each={filteredUsers()}>{(u) => (
    <>
        <TableRow
            class="cursor-pointer hover:bg-zinc-800"
            onClick={() => setExpandedUserId(expandedUserId() === u.id ? null : u.id)}
        >
            <TableCell>{u.name}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>{u.school || '-'}</TableCell>
            <TableCell>{u.admin ? 'Yes' : 'No'}</TableCell>
            <TableCell>{u.verified ? 'Yes' : 'No'}</TableCell>
            <TableCell class="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {/* existing buttons */}
            </TableCell>
        </TableRow>
        {expandedUserId() === u.id && (
            <TableRow class="bg-zinc-900">
                <TableCell colSpan={6}>
                    <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span class="text-zinc-400">Phone:</span> {u.phone || '-'}</div>
                        <div><span class="text-zinc-400">Grade:</span> {u.grade || '-'}</div>
                        <div><span class="text-zinc-400">Major:</span> {u.major || '-'}</div>
                        <div><span class="text-zinc-400">Shirt:</span> {u.shirt || '-'}</div>
                        <div><span class="text-zinc-400">Team:</span> {u.teams?.[0]?.name || 'No team'}</div>
                        <div><span class="text-zinc-400">Created:</span> {new Date(u.createdAt).toLocaleDateString()}</div>
                        <div class="col-span-2">
                            <span class="text-zinc-400">Parents:</span> {u.parents ? JSON.parse(u.parents).map(p => `${p.fname} ${p.lname}`).join(', ') : '-'}
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        )}
    </>
)}</For>
```

**Step 4: Add School column to table header**

Update TableHeader to include School:

```jsx
<TableHeader>
    <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>School</TableHead>
        <TableHead>Admin</TableHead>
        <TableHead>Verified</TableHead>
        <TableHead>Actions</TableHead>
    </TableRow>
</TableHeader>
```

**Step 5: Verify expandable rows work**

Click a user row to expand, verify details show, click again to collapse.

---

## Task 4: Add Teams Management Tab

**Files:**
- Modify: `src/components/AdminManage.jsx`
- Modify: `vite-plugin-auth.ts`

**Step 1: Add backend endpoint for admin teams**

In `vite-plugin-auth.ts`, add after the `/api/admin/users` handler:

```typescript
server.middlewares.use('/api/admin/teams', async (req, res) => {
    if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
    }
    const currentUser = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!currentUser?.admin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Forbidden' }));
    }

    if (req.method === 'GET') {
        const teams = await prisma.team.findMany({
            include: {
                members: { select: { id: true, name: true, email: true } },
                leader: { select: { id: true, name: true, email: true } },
                requests: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { id: 'desc' }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ teams }));
    } else if (req.method === 'POST') {
        const { action, teamId } = req.body;
        if (!teamId) return res.writeHead(400).end();

        try {
            if (action === 'delete') {
                await prisma.request.deleteMany({ where: { teamId } });
                await prisma.registration.updateMany({
                    where: { teamId },
                    data: { teamId: null, status: 2 }
                });
                await prisma.team.delete({ where: { id: teamId } });
            }
            res.writeHead(200).end(JSON.stringify({ success: true }));
        } catch (e) {
            console.error(e);
            res.writeHead(500).end(JSON.stringify({ error: 'Action failed' }));
        }
    }
});
```

**Step 2: Add Teams tab trigger**

Update TabsList to include Teams:

```jsx
<TabsList>
    <TabsTrigger value="schools">Schools</TabsTrigger>
    <TabsTrigger value="majors">Majors</TabsTrigger>
    <TabsTrigger value="categories">Categories</TabsTrigger>
    <TabsTrigger value="teams">Teams</TabsTrigger>
    <TabsTrigger value="users">Users</TabsTrigger>
    <TabsIndicator />
</TabsList>
```

**Step 3: Update fetchTeams to use admin endpoint**

```jsx
const fetchTeams = () => {
    fetch('/api/admin/teams').then(res => res.json()).then(data => {
        setTeams(data.teams || []);
    });
};
```

**Step 4: Add Teams TabsContent**

After the categories TabsContent:

```jsx
<TabsContent value="teams" class="space-y-4">
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
                <TableRow>
                    <TableCell>{team.name}</TableCell>
                    <TableCell class="max-w-[200px] truncate">{team.project}</TableCell>
                    <TableCell>{team.leader?.name || '-'}</TableCell>
                    <TableCell>{team.members?.length || 0}/{team.maxSize}</TableCell>
                    <TableCell>{team.requests?.length || 0}</TableCell>
                    <TableCell>
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
            )}</For>
        </TableBody>
    </Table>
</TabsContent>
```

**Step 5: Add fetchTeams to createEffect**

Update the createEffect:

```jsx
createEffect(() => {
    fetchSchools();
    fetchCategories();
    fetchUsers();
    fetchTeams();
});
```

**Step 6: Verify Teams tab works**

Navigate to Teams tab, verify teams display with member counts, test delete functionality.

---

## Task 5: Final Testing and Cleanup

**Step 1: Test all features end-to-end**

- Stats header shows correct counts
- Search filters users by name/email
- Verified filter works
- School filter works
- Clicking user row expands details
- Teams tab shows all teams
- Delete team works

**Step 2: Commit changes**

```bash
git add src/components/AdminManage.jsx vite-plugin-auth.ts
git commit -m "feat: enhance admin panel with search, filters, expanded details, and teams tab"
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/components/AdminManage.jsx` | Stats header, search/filters, expandable rows, teams tab |
| `vite-plugin-auth.ts` | `/api/admin/teams` endpoint, users include teams |
