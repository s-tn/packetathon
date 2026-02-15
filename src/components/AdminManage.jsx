import { createSignal, createEffect, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField, TextFieldRoot, TextFieldLabel } from "@/components/ui/textfield";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const AdminManage = (props) => {
    const [ schools, setSchools ] = createSignal([]);
    const [ categories, setCategories ] = createSignal([]);
    const [ users, setUsers ] = createSignal([]);
    const [ teams, setTeams ] = createSignal([]);
    const [activeTab, setActiveTab] = createSignal('schools');
    const [searchQuery, setSearchQuery] = createSignal('');
    const [filterVerified, setFilterVerified] = createSignal('all');
    const [filterSchool, setFilterSchool] = createSignal('all');
    const [expandedUserId, setExpandedUserId] = createSignal(null);
    const [expandedTeamId, setExpandedTeamId] = createSignal(null);
    const [expandedSchoolId, setExpandedSchoolId] = createSignal(null);
    const [adminTeamLeader, setAdminTeamLeader] = createSignal(null);
    const [editingCategoryId, setEditingCategoryId] = createSignal(null);
    const [editingSchoolId, setEditingSchoolId] = createSignal(null);
    const [teamSelectedCategories, setTeamSelectedCategories] = createSignal([]);
    const [categoryInfoOpen, setCategoryInfoOpen] = createSignal(false);
    const [categoryInfoData, setCategoryInfoData] = createSignal(null);
    const [importStatus, setImportStatus] = createSignal(null);

    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        return lines.slice(1).filter(l => l.trim()).map(line => {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (const char of line) {
                if (char === '"') { inQuotes = !inQuotes; }
                else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
                else { current += char; }
            }
            values.push(current.trim());
            const obj = {};
            headers.forEach((h, i) => { obj[h] = values[i] || ''; });
            return obj;
        });
    };

    const handleStudentCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const rows = parseCSV(ev.target.result);
            if (!rows.length) { alert('No data rows found in CSV'); return; }
            setImportStatus({ type: 'loading', message: `Importing ${rows.length} students...` });
            fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'import-students', userId: 0, data: { students: rows } })
            }).then(r => r.json()).then(d => {
                setImportStatus({ type: 'success', message: `Created: ${d.created}, Skipped: ${d.skipped}${d.errors?.length ? '\n' + d.errors.join('\n') : ''}` });
                fetchUsers();
            }).catch(() => setImportStatus({ type: 'error', message: 'Import failed' }));
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleTeamCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const rows = parseCSV(ev.target.result);
            if (!rows.length) { alert('No data rows found in CSV'); return; }
            setImportStatus({ type: 'loading', message: `Importing ${rows.length} teams...` });
            fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'import-teams', data: { teams: rows.map(r => ({ name: r.name || r.teamname, project: r.project || r.description || '', leaderEmail: r.leaderemail || r.leader || r.email, maxSize: r.maxsize || r.max || '4' })) } })
            }).then(r => r.json()).then(d => {
                setImportStatus({ type: 'success', message: `Created: ${d.created}, Skipped: ${d.skipped}${d.errors?.length ? '\n' + d.errors.join('\n') : ''}` });
                fetchTeams();
            }).catch(() => setImportStatus({ type: 'error', message: 'Import failed' }));
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const showCategoryInfo = (cat) => {
        setCategoryInfoData(cat);
        setCategoryInfoOpen(true);
    };

    const CategoryPicker = (props) => {
        const cats = () => props.categories || categories() || [];
        return (
            <div class="space-y-2">
                {!props.hideLabel && <div class="text-left w-full text-sm font-medium">Award Categories</div>}
                <div class="grid grid-cols-2 gap-2">
                    {cats().map(cat => {
                        const isSelected = () => (props.selected || []).some(s => s.value === cat.value);
                        return (
                            <button
                                type="button"
                                class={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all border ${isSelected() ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'}`}
                                onClick={() => {
                                    if (isSelected()) {
                                        props.onChange((props.selected || []).filter(s => s.value !== cat.value));
                                    } else {
                                        props.onChange([...(props.selected || []), { value: cat.value, label: cat.label }]);
                                    }
                                }}
                            >
                                <span>{cat.label}{cat.prize ? ` ($${cat.prize})` : ''}</span>
                                {cat.description && (
                                    <span
                                        class={`ml-2 shrink-0 ${isSelected() ? 'text-blue-200' : 'text-zinc-400'}`}
                                        onClick={(e) => { e.stopPropagation(); showCategoryInfo(cat); }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

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

    const fetchCategories = () => {
        fetch('/api/categories').then(res => res.json()).then(data => {
            setCategories(data.categories);
        });
    };

    const fetchUsers = () => {
        fetch('/api/admin/users').then(res => res.json()).then(data => {
            setUsers(data.users);
        });
    };

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
        <div class="space-y-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Manage System</h2>
                <Button onClick={() => props.setPage('/admin')}>Back</Button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-zinc-100 border border-zinc-200 rounded-lg">
                <div class="text-center">
                    <div class="text-2xl font-bold text-zinc-900">{users().length}</div>
                    <div class="text-sm text-zinc-500">Total Users</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-zinc-900">{users().filter(u => u.verified).length}</div>
                    <div class="text-sm text-zinc-500">Verified</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-zinc-900">{teams().length}</div>
                    <div class="text-sm text-zinc-500">Teams</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-zinc-900">{users().filter(u => !u.verified).length}</div>
                    <div class="text-sm text-zinc-500">Unverified</div>
                </div>
            </div>

            {/* Tab bar - use .map() instead of <For> for static data */}
            <div class="flex gap-1 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
                {['schools', 'categories', 'teams', 'users'].map(tab => (
                    <button
                        type="button"
                        class={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab() === tab ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'schools' ? 'Schools & Majors' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* ============ SCHOOLS TAB ============ */}
            <div style={{ display: activeTab() === 'schools' ? 'block' : 'none' }}>
                <div class="space-y-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        fetch('/api/schools', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ label: formData.get('label'), value: formData.get('value') })
                        }).then(res => res.json()).then(() => { fetchSchools(); e.target.reset(); });
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

                    <For each={schools()}>{(school) => (
                        <Card class="border-zinc-200">
                            <CardContent class="p-4">
                                <div class="flex items-center justify-between mb-3">
                                    {editingSchoolId() === school.id ? (
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            fetch('/api/schools', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: school.id, label: fd.get('label'), value: fd.get('value') })
                                            }).then(() => { fetchSchools(); setEditingSchoolId(null); });
                                        }} class="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                                            <TextField name="label" value={school.label} class="p-1 text-sm w-40" />
                                            <TextField name="value" value={school.value} class="p-1 text-sm w-20" />
                                            <Button type="submit" size="sm">Save</Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingSchoolId(null)}>Cancel</Button>
                                        </form>
                                    ) : (
                                        <div class="flex items-center gap-3">
                                            <span class="font-semibold text-lg">{school.label}</span>
                                            <span class="text-zinc-400 text-sm">({school.value})</span>
                                            <button class="text-zinc-400 hover:text-zinc-600 text-xs" onClick={() => setEditingSchoolId(school.id)}>Edit</button>
                                        </div>
                                    )}
                                    <Button variant="destructive" size="sm" onClick={() => {
                                        if(!confirm('Delete school and all its majors?')) return;
                                        fetch('/api/schools', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: school.id }) }).then(() => fetchSchools());
                                    }}>Delete</Button>
                                </div>

                                <div class="flex flex-wrap gap-3 mb-3 text-sm">
                                    <div class="flex items-center gap-2">
                                        <span class="text-zinc-500">Self-Registration:</span>
                                        <Button size="sm" variant={school.allowSelfRegistration ? "outline" : "destructive"} onClick={() => {
                                            fetch('/api/schools', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: school.id, allowSelfRegistration: !school.allowSelfRegistration }) }).then(() => fetchSchools());
                                        }}>{school.allowSelfRegistration ? 'On' : 'Off'}</Button>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-zinc-500">Team Creation:</span>
                                        <Button size="sm" variant={school.allowTeamCreation ? "outline" : "destructive"} onClick={() => {
                                            fetch('/api/schools', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: school.id, allowTeamCreation: !school.allowTeamCreation }) }).then(() => fetchSchools());
                                        }}>{school.allowTeamCreation ? 'On' : 'Off'}</Button>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-zinc-500">Admins:</span>
                                        <span>{school.admins?.length > 0 ? school.admins.map(a => a.user?.name || a.user?.email).join(', ') : <span class="text-zinc-400">None</span>}</span>
                                    </div>
                                </div>

                                {/* Expandable majors */}
                                <button type="button" class="text-sm text-blue-600 hover:text-blue-800 mb-2" onClick={() => setExpandedSchoolId(expandedSchoolId() === school.id ? null : school.id)}>
                                    {expandedSchoolId() === school.id ? 'Hide' : 'Show'} Majors ({school.majors?.length || 0})
                                </button>

                                {expandedSchoolId() === school.id && (
                                    <div class="border-t border-zinc-200 pt-3 mt-2 space-y-2">
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            fetch('/api/majors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: fd.get('label'), value: fd.get('value'), schoolId: school.id }) }).then(() => { fetchSchools(); e.target.reset(); });
                                        }} class="flex gap-2 items-end">
                                            <TextFieldRoot class="w-full">
                                                <TextFieldLabel>Major Name</TextFieldLabel>
                                                <TextField name="label" placeholder="e.g. Computer Science" required class="p-2"/>
                                            </TextFieldRoot>
                                            <TextFieldRoot class="w-full">
                                                <TextFieldLabel>Value (ID)</TextFieldLabel>
                                                <TextField name="value" placeholder="e.g. compsci" required class="p-2"/>
                                            </TextFieldRoot>
                                            <Button type="submit" size="sm">Add</Button>
                                        </form>
                                        {school.majors?.length > 0 ? (
                                            <div class="space-y-1">
                                                <For each={school.majors}>{(major) => (
                                                    <div class="flex items-center justify-between py-1 px-2 rounded hover:bg-zinc-100">
                                                        <span class="text-sm">{major.label} <span class="text-zinc-400">({major.value})</span></span>
                                                        <Button variant="destructive" size="sm" onClick={() => {
                                                            if(!confirm('Delete major?')) return;
                                                            fetch('/api/majors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: major.id }) }).then(() => fetchSchools());
                                                        }}>Delete</Button>
                                                    </div>
                                                )}</For>
                                            </div>
                                        ) : (
                                            <div class="text-sm text-zinc-400 italic">No majors added yet</div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}</For>
                </div>
            </div>

            {/* ============ CATEGORIES TAB ============ */}
            <div style={{ display: activeTab() === 'categories' ? 'block' : 'none' }}>
                <div class="space-y-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        fetch('/api/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ label: formData.get('label'), value: formData.get('value'), description: formData.get('description'), prize: formData.get('prize') })
                        }).then(res => res.json()).then(() => { fetchCategories(); e.target.reset(); });
                    }} class="flex flex-col gap-2 w-full">
                        <div class="flex gap-2 items-end">
                            <TextFieldRoot class="w-full">
                                <TextFieldLabel>Category Name</TextFieldLabel>
                                <TextField name="label" placeholder="e.g. Best AI Project" required class="p-2"/>
                            </TextFieldRoot>
                            <TextFieldRoot class="w-full">
                                <TextFieldLabel>Value (ID)</TextFieldLabel>
                                <TextField name="value" placeholder="e.g. ai" required class="p-2"/>
                            </TextFieldRoot>
                        </div>
                        <div class="flex gap-2 items-end">
                            <TextFieldRoot class="w-full">
                                <TextFieldLabel>Description</TextFieldLabel>
                                <TextField name="description" placeholder="Describe what this award category is for..." class="p-2"/>
                            </TextFieldRoot>
                            <TextFieldRoot class="w-[120px]">
                                <TextFieldLabel>Prize ($)</TextFieldLabel>
                                <TextField name="prize" type="number" min="0" step="0.01" placeholder="0" class="p-2"/>
                            </TextFieldRoot>
                            <Button type="submit">Add</Button>
                        </div>
                    </form>

                    <For each={categories()}>{(cat) => (
                        <Card class="border-zinc-200">
                            <CardContent class="p-4">
                                {editingCategoryId() === cat.id ? (
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.currentTarget);
                                        fetch('/api/categories', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: cat.id, label: fd.get('label'), description: fd.get('desc'), prize: fd.get('prize') })
                                        }).then(() => { fetchCategories(); setEditingCategoryId(null); });
                                    }} class="space-y-2">
                                        <div class="flex gap-2 items-end">
                                            <TextFieldRoot class="flex-1">
                                                <TextFieldLabel>Label</TextFieldLabel>
                                                <TextField name="label" value={cat.label} class="p-1 text-sm" />
                                            </TextFieldRoot>
                                            <TextFieldRoot class="w-24">
                                                <TextFieldLabel>Prize ($)</TextFieldLabel>
                                                <TextField name="prize" type="number" min="0" step="0.01" value={cat.prize || 0} class="p-1 text-sm" />
                                            </TextFieldRoot>
                                        </div>
                                        <TextFieldRoot class="w-full">
                                            <TextFieldLabel>Description</TextFieldLabel>
                                            <TextField name="desc" value={cat.description} class="p-1 text-sm" />
                                        </TextFieldRoot>
                                        <div class="flex gap-2">
                                            <Button type="submit" size="sm">Save</Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditingCategoryId(null)}>Cancel</Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="font-semibold">{cat.label} <span class="text-zinc-400 text-sm font-normal">({cat.value})</span></div>
                                            <div class="text-sm text-zinc-500 mt-1">{cat.description || <span class="italic text-zinc-400">No description</span>}</div>
                                            {cat.prize > 0 && <div class="text-sm font-medium text-green-600 mt-1">Prize: ${cat.prize.toLocaleString()}</div>}
                                        </div>
                                        <div class="flex gap-2 shrink-0">
                                            <Button size="sm" variant="outline" onClick={() => setEditingCategoryId(cat.id)}>Edit</Button>
                                            <Button variant="destructive" size="sm" onClick={() => {
                                                if(!confirm('Delete category?')) return;
                                                fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cat.id }) }).then(() => fetchCategories());
                                            }}>Delete</Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}</For>
                </div>
            </div>

            {/* ============ TEAMS TAB ============ */}
            <div style={{ display: activeTab() === 'teams' ? 'block' : 'none' }}>
                <div class="space-y-4">
                    <Card class="border-zinc-200">
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
                                            categories: JSON.stringify(teamSelectedCategories()),
                                        }
                                    })
                                }).then(r => r.json()).then(d => {
                                    if (d.success) { fetchTeams(); e.target.reset(); setAdminTeamLeader(null); setTeamSelectedCategories([]); }
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
                            <div class="mt-3">
                                <CategoryPicker categories={categories()} selected={teamSelectedCategories()} onChange={setTeamSelectedCategories} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card class="border-zinc-200">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-lg">Import Teams from CSV</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm text-zinc-500 mb-3">CSV columns: name, project, leaderEmail, maxSize</p>
                            <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                Choose CSV File
                                <input type="file" accept=".csv" class="hidden" onChange={handleTeamCSV} />
                            </label>
                        </CardContent>
                    </Card>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Leader</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <For each={teams()}>{(team) => (
                                <>
                                    <TableRow class="cursor-pointer" onClick={() => setExpandedTeamId(expandedTeamId() === team.id ? null : team.id)}>
                                        <TableCell class="font-medium">{team.name}</TableCell>
                                        <TableCell class="text-sm text-zinc-600 truncate max-w-[200px]">{team.project}</TableCell>
                                        <TableCell class="text-sm">{team.leader?.name || '-'}</TableCell>
                                        <TableCell class="text-sm">{team.members?.length || 0}/{team.maxSize}</TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button variant="destructive" size="sm" onClick={() => {
                                                if (!confirm(`Delete team "${team.name}"?`)) return;
                                                fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', teamId: team.id }) }).then(() => fetchTeams());
                                            }}>Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                    {expandedTeamId() === team.id && (
                                        <TableRow>
                                            <TableCell colSpan={5} class="bg-zinc-50 border-b">
                                                <div class="p-4 space-y-4">
                                                    <div>
                                                        <div class="text-sm text-zinc-500 font-medium mb-2">Categories</div>
                                                        <CategoryPicker
                                                            hideLabel
                                                            categories={categories()}
                                                            selected={(() => { try { return JSON.parse(team.categories || '[]'); } catch { return []; } })()}
                                                            onChange={(newCats) => {
                                                                fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'edit', teamId: team.id, data: { categories: JSON.stringify(newCats) } }) }).then(() => fetchTeams());
                                                            }}
                                                        />
                                                    </div>
                                                    <div class="text-sm">
                                                        <span class="text-zinc-500 font-medium">Members:</span>
                                                        <div class="mt-1 space-y-1">
                                                            <For each={team.members}>{(member) => (
                                                                <div class="flex items-center justify-between">
                                                                    <span>{member.name} ({member.email}) {member.id === team.leaderId && <span class="text-amber-600 text-xs ml-1">Leader</span>}</span>
                                                                    {member.id !== team.leaderId && (
                                                                        <Button size="sm" variant="outline" onClick={() => {
                                                                            if (!confirm(`Remove ${member.name}?`)) return;
                                                                            fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove-member', teamId: team.id, data: { userId: member.id } }) }).then(() => fetchTeams());
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
                                                                    fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add-member', teamId: team.id, data: { userId: val.id } }) }).then(() => fetchTeams());
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
                </div>
            </div>

            {/* ============ USERS TAB ============ */}
            <div style={{ display: activeTab() === 'users' ? 'block' : 'none' }}>
                <div class="space-y-4">
                    <Card class="border-zinc-200">
                        <CardHeader class="pb-2">
                            <CardTitle class="text-lg">Import Students from CSV</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-sm text-zinc-500 mb-3">CSV columns: name, email, phone, school, major, grade, shirt, password (optional)</p>
                            <div class="flex items-center gap-3">
                                <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                    Choose CSV File
                                    <input type="file" accept=".csv" class="hidden" onChange={handleStudentCSV} />
                                </label>
                                {importStatus() && (
                                    <div class={`text-sm ${importStatus().type === 'error' ? 'text-red-600' : importStatus().type === 'success' ? 'text-green-600' : 'text-blue-600'}`}>
                                        <pre class="whitespace-pre-wrap">{importStatus().message}</pre>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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
                            options={[{ value: 'all', label: 'All' }, { value: 'yes', label: 'Verified' }, { value: 'no', label: 'Unverified' }]}
                            optionValue="value" optionTextValue="label" value={filterVerified()}
                            onChange={(val) => setFilterVerified(val?.value || 'all')}
                            itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                        >
                            <SelectTrigger class="w-[130px]">
                                <SelectValue>{state => state.selectedOption()?.label || 'All'}</SelectValue>
                            </SelectTrigger>
                            <SelectContent />
                        </Select>
                        <Select
                            options={[{ value: 'all', label: 'All Schools' }, ...schools().map(s => ({ value: s.value, label: s.label }))]}
                            optionValue="value" optionTextValue="label" value={filterSchool()}
                            onChange={(val) => setFilterSchool(val?.value || 'all')}
                            itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                        >
                            <SelectTrigger class="w-[140px]">
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
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <For each={filteredUsers()}>{(u) => (
                                <>
                                    <TableRow class="cursor-pointer" onClick={() => setExpandedUserId(expandedUserId() === u.id ? null : u.id)}>
                                        <TableCell class="font-medium">{u.name}</TableCell>
                                        <TableCell class="text-sm">{u.email}</TableCell>
                                        <TableCell class="text-sm">{u.school || '-'}</TableCell>
                                        <TableCell class="text-sm">
                                            <div class="flex gap-1">
                                                {u.admin && <span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Admin</span>}
                                                {u.verified ? <span class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Verified</span> : <span class="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Unverified</span>}
                                                {u.schoolAdminAssignments?.length > 0 && <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">School Admin</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedUserId() === u.id && (
                                        <TableRow>
                                            <TableCell colSpan={4} class="bg-zinc-50 border-b">
                                                <div class="p-4 space-y-4">
                                                    {/* User details */}
                                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div><span class="text-zinc-500">Phone:</span> {u.phone || '-'}</div>
                                                        <div><span class="text-zinc-500">Grade:</span> {u.grade || '-'}</div>
                                                        <div><span class="text-zinc-500">Major:</span> {u.major || '-'}</div>
                                                        <div><span class="text-zinc-500">Shirt:</span> {u.shirt || '-'}</div>
                                                        <div><span class="text-zinc-500">Team:</span> {u.teams?.[0]?.name || 'No team'}</div>
                                                        <div><span class="text-zinc-500">Created:</span> {new Date(u.createdAt).toLocaleDateString()}</div>
                                                        <div class="col-span-2"><span class="text-zinc-500">Parents:</span> {u.parents ? (() => { try { return JSON.parse(u.parents).map(p => `${p.fname} ${p.lname}`).join(', '); } catch { return '-'; } })() : '-'}</div>
                                                    </div>

                                                    {/* School admin assignments */}
                                                    <div class="text-sm">
                                                        <span class="text-zinc-500 font-medium">School Admin of:</span>{' '}
                                                        {u.schoolAdminAssignments?.length > 0
                                                            ? u.schoolAdminAssignments.map(a => (
                                                                <span class="inline-flex items-center gap-1 mr-2 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                                                                    {a.school?.label}
                                                                    <button class="text-red-500 hover:text-red-700 text-xs ml-1" onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!confirm(`Remove ${u.name} as admin of ${a.school?.label}?`)) return;
                                                                        fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove-school-admin', userId: u.id, data: { schoolId: a.school?.id } }) }).then(() => fetchUsers());
                                                                    }}>x</button>
                                                                </span>
                                                            ))
                                                            : <span class="text-zinc-400">None</span>
                                                        }
                                                    </div>

                                                    {/* Actions */}
                                                    <div class="flex flex-wrap gap-2 pt-2 border-t border-zinc-200">
                                                        <Button size="sm" variant="outline" onClick={() => {
                                                            fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: u.verified ? 'unverify' : 'verify', userId: u.id }) }).then(() => fetchUsers());
                                                        }}>{u.verified ? 'Unverify' : 'Verify'}</Button>

                                                        <Button size="sm" variant="outline" onClick={() => {
                                                            fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: u.admin ? 'demote' : 'promote', userId: u.id }) }).then(() => fetchUsers());
                                                        }}>{u.admin ? 'Remove Admin' : 'Make Admin'}</Button>

                                                        <Select
                                                            options={schools().filter(s => !u.schoolAdminAssignments?.some(a => a.school?.id === s.id))}
                                                            optionValue="id" optionTextValue="label" placeholder="+ School Admin"
                                                            onChange={(val) => {
                                                                if (!val) return;
                                                                fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign-school-admin', userId: u.id, data: { schoolId: val.id } }) }).then(() => fetchUsers());
                                                            }}
                                                            itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                                                        >
                                                            <SelectTrigger class="w-[160px]">
                                                                <SelectValue>{state => state.selectedOption()?.label || '+ School Admin'}</SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent />
                                                        </Select>

                                                        <Button size="sm" variant="destructive" onClick={() => {
                                                            if(!confirm('Delete user? This cannot be undone.')) return;
                                                            fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', userId: u.id }) }).then(() => fetchUsers());
                                                        }}>Delete</Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}</For>
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Category info modal */}
            <Show when={categoryInfoOpen()}>
                <Portal>
                    <div class="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setCategoryInfoOpen(false)}>
                        <div class="absolute inset-0 bg-black/50" />
                        <div class="relative bg-white border border-zinc-200 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <button class="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600" onClick={() => setCategoryInfoOpen(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                            <h3 class="text-lg font-semibold text-zinc-900 mb-2">{categoryInfoData()?.label}</h3>
                            {categoryInfoData()?.prize > 0 && <p class="text-sm font-medium text-green-600 mb-2">Prize: ${categoryInfoData()?.prize?.toLocaleString()}</p>}
                            <p class="text-sm text-zinc-600 leading-relaxed">{categoryInfoData()?.description}</p>
                        </div>
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default AdminManage;
