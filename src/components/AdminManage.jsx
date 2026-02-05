import { createSignal, createEffect, For } from "solid-js";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldRoot, TextFieldLabel } from "@/components/ui/textfield";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@kobalte/core/select";


const AdminManage = (props) => {
    const [ schools, setSchools ] = createSignal([]);
    const [ majors, setMajors ] = createSignal([]);
    const [ categories, setCategories ] = createSignal([]);
    const [ users, setUsers ] = createSignal([]);
    const [ teams, setTeams ] = createSignal([]);
    const [ selectedSchool, setSelectedSchool ] = createSignal(null);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [filterVerified, setFilterVerified] = createSignal('all');
    const [filterSchool, setFilterSchool] = createSignal('all');
    const [expandedUserId, setExpandedUserId] = createSignal(null);

    const filteredUsers = () => {
        return users().filter(u => {
            const query = searchQuery().toLowerCase();
            if (query && !u.name?.toLowerCase().includes(query) && !u.email?.toLowerCase().includes(query)) {
                return false;
            }
            if (filterVerified() === 'yes' && !u.verified) return false;
            if (filterVerified() === 'no' && u.verified) return false;
            if (filterSchool() !== 'all' && u.school !== filterSchool()) return false;
            return true;
        });
    };

    const fetchSchools = () => {
        fetch('/api/schools').then(res => res.json()).then(data => {
            setSchools(data.schools);
        });
    };

    const fetchMajors = () => { // Actually currently majors are inside schools, but API allows adding/deleting
        // We can just re-fetch schools since majors are included
        fetchSchools();
    };

    const fetchCategories = () => {
        fetch('/api/categories').then(res => res.json()).then(data => {
            setCategories(data.categories);
        });
    };

    const fetchUsers = () => {
        fetch('/api/admin/users').then(res => res.json()).then(data => {
            setUsers(data.users);
        });
    }

    const fetchTeams = () => {
        fetch('/api/admin/teams').then(res => res.json()).then(data => {
            setTeams(data.teams || []);
        });
    };

    createEffect(() => {
        fetchSchools();
        fetchCategories();
        fetchUsers();
        fetchTeams();
    });

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Manage System</h2>
                <Button onClick={() => props.setPage('/admin')}>Back</Button>
            </div>
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
            <Tabs defaultValue="schools">
                <TabsList>
                    <TabsTrigger value="schools">Schools</TabsTrigger>
                    <TabsTrigger value="majors">Majors</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsIndicator />
                </TabsList>
                
                <TabsContent value="schools" class="space-y-4">
                    <div class="flex gap-2 items-end">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const label = formData.get('label');
                            const value = formData.get('value');
                            fetch('/api/schools', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ label, value })
                            }).then(res => res.json()).then(() => {
                                fetchSchools();
                                e.target.reset();
                            });
                        }} class="flex gap-2 items-end w-full">
                             <TextFieldRoot class="w-full">
                                <TextFieldLabel>School Name</TextFieldLabel>
                                <TextField name="label" placeholder="e.g. Bergen Tech" required class="p-2"/>
                            </TextFieldRoot>
                            <TextFieldRoot class="w-full">
                                <TextFieldLabel>Value (ID)</TextFieldLabel>
                                <TextField name="value" placeholder="e.g. bt" required class="p-2"/>
                            </TextFieldRoot>
                            <Button type="submit">Add School</Button>
                        </form>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Label</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <For each={schools()}>{(school) => (
                                <TableRow>
                                    <TableCell>{school.label}</TableCell>
                                    <TableCell>{school.value}</TableCell>
                                    <TableCell>
                                        <Button variant="destructive" size="sm" onClick={() => {
                                            if(!confirm('Delete school and all its majors?')) return;
                                            fetch('/api/schools', {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: school.id })
                                            }).then(() => fetchSchools());
                                        }}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            )}</For>
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="majors" class="space-y-4">
                     <div class="space-y-2">
                        <Label>Select School to Manage Majors</Label>
                        <Select
                            options={schools()}
                            optionValue="id"
                            optionTextValue="label"
                            placeholder="Select School"
                            onChange={setSelectedSchool}
                            itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                        >
                            <SelectTrigger>
                                <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                            </SelectTrigger>
                            <SelectContent />
                        </Select>
                     </div>

                     {selectedSchool() && (
                         <>
                            <div class="flex gap-2 items-end">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const label = formData.get('label');
                                    const value = formData.get('value');
                                    fetch('/api/majors', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ label, value, schoolId: selectedSchool().id })
                                    }).then(() => {
                                        fetchSchools(); // Refresh schools to get updated majors
                                        e.target.reset();
                                    });
                                }} class="flex gap-2 items-end w-full">
                                    <TextFieldRoot class="w-full">
                                        <TextFieldLabel>Major Name</TextFieldLabel>
                                        <TextField name="label" placeholder="e.g. Computer Science" required class="p-2"/>
                                    </TextFieldRoot>
                                    <TextFieldRoot class="w-full">
                                        <TextFieldLabel>Value (ID)</TextFieldLabel>
                                        <TextField name="value" placeholder="e.g. compsci" required class="p-2"/>
                                    </TextFieldRoot>
                                    <Button type="submit">Add Major</Button>
                                </form>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <For each={selectedSchool().majors}>{(major) => (
                                        <TableRow>
                                            <TableCell>{major.label}</TableCell>
                                            <TableCell>{major.value}</TableCell>
                                            <TableCell>
                                                <Button variant="destructive" size="sm" onClick={() => {
                                                    if(!confirm('Delete major?')) return;
                                                    fetch('/api/majors', {
                                                        method: 'DELETE',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: major.id })
                                                    }).then(() => fetchSchools());
                                                }}>Delete</Button>
                                            </TableCell>
                                        </TableRow>
                                    )}</For>
                                </TableBody>
                            </Table>
                         </>
                     )}
                </TabsContent>

                <TabsContent value="categories" class="space-y-4">
                    <div class="flex gap-2 items-end">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const label = formData.get('label');
                            const value = formData.get('value');
                            fetch('/api/categories', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ label, value })
                            }).then(res => res.json()).then(() => {
                                fetchCategories();
                                e.target.reset();
                            });
                        }} class="flex gap-2 items-end w-full">
                             <TextFieldRoot class="w-full">
                                <TextFieldLabel>Category Name</TextFieldLabel>
                                <TextField name="label" placeholder="e.g. Best AI Project" required class="p-2"/>
                            </TextFieldRoot>
                            <TextFieldRoot class="w-full">
                                <TextFieldLabel>Value (ID)</TextFieldLabel>
                                <TextField name="value" placeholder="e.g. ai" required class="p-2"/>
                            </TextFieldRoot>
                            <Button type="submit">Add Category</Button>
                        </form>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Label</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <For each={categories()}>{(cat) => (
                                <TableRow>
                                    <TableCell>{cat.label}</TableCell>
                                    <TableCell>{cat.value}</TableCell>
                                    <TableCell>
                                        <Button variant="destructive" size="sm" onClick={() => {
                                            if(!confirm('Delete category?')) return;
                                            fetch('/api/categories', {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: cat.id })
                                            }).then(() => fetchCategories());
                                        }}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            )}</For>
                        </TableBody>
                    </Table>
                </TabsContent>

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

                <TabsContent value="users" class="space-y-4">
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
                     <Table>
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
                        <TableBody>
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
                                            <Button size="sm" variant="outline" onClick={() => {
                                                fetch('/api/admin/users', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: u.verified ? 'unverify' : 'verify', userId: u.id })
                                                }).then(() => fetchUsers());
                                            }}>{u.verified ? 'Unverify' : 'Verify'}</Button>

                                            <Button size="sm" variant="outline" onClick={() => {
                                                 fetch('/api/admin/users', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: u.admin ? 'demote' : 'promote', userId: u.id })
                                                }).then(() => fetchUsers());
                                            }}>{u.admin ? 'Demote' : 'Promote'}</Button>

                                            <Button size="sm" variant="destructive" onClick={() => {
                                                 if(!confirm('Delete user? This cannot be undone.')) return;
                                                 fetch('/api/admin/users', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'delete', userId: u.id })
                                                }).then(() => fetchUsers());
                                            }}>Delete</Button>
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
                        </TableBody>
                     </Table>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminManage;
