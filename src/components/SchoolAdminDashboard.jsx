import { createSignal, createEffect, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
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

const SchoolAdminDashboard = (props) => {
  const [view, setView] = createSignal('picker'); // picker | list | edit | register
  const [schools, setSchools] = createSignal([]);
  const [selectedSchool, setSelectedSchool] = createSignal(null);
  const [students, setStudents] = createSignal([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedStudent, setSelectedStudent] = createSignal(null);
  const [saving, setSaving] = createSignal(false);
  const [registering, setRegistering] = createSignal(false);
  const [saTeams, setSaTeams] = createSignal([]);
  const [saExpandedTeamId, setSaExpandedTeamId] = createSignal(null);
  const [saTeamLeader, setSaTeamLeader] = createSignal(null);
  const [availableCategories, setAvailableCategories] = createSignal([]);
  const [teamSelectedCategories, setTeamSelectedCategories] = createSignal([]);
  const [categoryInfoOpen, setCategoryInfoOpen] = createSignal(false);
  const [categoryInfoData, setCategoryInfoData] = createSignal(null);

  const showCategoryInfo = (cat) => {
    setCategoryInfoData(cat);
    setCategoryInfoOpen(true);
  };

  const CategoryPicker = (props) => {
    const cats = () => props.categories || availableCategories() || [];
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

  // Edit form signals
  const [editFname, setEditFname] = createSignal('');
  const [editLname, setEditLname] = createSignal('');
  const [editEmail, setEditEmail] = createSignal('');
  const [editPhone, setEditPhone] = createSignal('');
  const [editGrade, setEditGrade] = createSignal('');
  const [editMajor, setEditMajor] = createSignal('');
  const [editShirt, setEditShirt] = createSignal('');

  // Register form signals
  const [regFname, setRegFname] = createSignal('');
  const [regLname, setRegLname] = createSignal('');
  const [regEmail, setRegEmail] = createSignal('');
  const [regPhone, setRegPhone] = createSignal('');
  const [regPassword, setRegPassword] = createSignal('');
  const [regGrade, setRegGrade] = createSignal(null);
  const [regMajor, setRegMajor] = createSignal(null);
  const [regShirt, setRegShirt] = createSignal(null);
  const [regParentFname, setRegParentFname] = createSignal('');
  const [regParentLname, setRegParentLname] = createSignal('');
  const [regParentEmail, setRegParentEmail] = createSignal('');
  const [regParentPhone, setRegParentPhone] = createSignal('');
  const [regParentRelationship, setRegParentRelationship] = createSignal('');

  // Fetch schools the admin manages
  createEffect(() => {
    fetch('/api/school-admin/schools').then(r => r.json()).then(data => {
      setSchools(data.schools || []);
      if (data.schools?.length === 1) {
        setSelectedSchool(data.schools[0]);
        setView('list');
      }
    });
    fetch('/api/categories').then(r => r.json()).then(data => {
      setAvailableCategories(data.categories || []);
    });
  });

  // Fetch students when school is selected or view changes to list
  createEffect(() => {
    if (selectedSchool() && (view() === 'list')) {
      fetchStudents();
      fetchTeams();
    }
  });

  const fetchStudents = () => {
    fetch('/api/school-admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school: selectedSchool().value }),
    }).then(r => r.json()).then(data => {
      setStudents(data.students || []);
    });
  };

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

  const filteredStudents = () => {
    const q = searchQuery().toLowerCase();
    if (!q) return students();
    return students().filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.fname?.toLowerCase().includes(q) ||
      s.lname?.toLowerCase().includes(q)
    );
  };

  const openEdit = (student) => {
    setSelectedStudent(student);
    setEditFname(student.fname || '');
    setEditLname(student.lname || '');
    setEditEmail(student.email || '');
    setEditPhone(student.phone || '');
    setEditGrade(student.grade || '');
    setEditMajor(student.major || '');
    setEditShirt(student.shirt || '');
    setView('edit');
  };

  const saveStudent = () => {
    setSaving(true);
    fetch('/api/school-admin/student/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedStudent().id,
        fname: editFname(),
        lname: editLname(),
        email: editEmail(),
        phone: editPhone(),
        grade: editGrade(),
        major: editMajor(),
        shirt: editShirt(),
      }),
    }).then(r => r.json()).then(data => {
      setSaving(false);
      if (!data.error) {
        alert('Student updated successfully');
        setView('list');
      } else {
        alert('Error updating student: ' + (data.error || 'Unknown error'));
      }
    }).catch(() => {
      setSaving(false);
      alert('Error updating student');
    });
  };

  const registerStudent = (e) => {
    e.preventDefault();
    if (!regPassword() || regPassword().length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setRegistering(true);

    const registrationData = {
      accountData: {
        name: `${regFname()} ${regLname()}`,
        email: regEmail(),
        password: regPassword(),
      },
      screen0: {
        'first-name': regFname(),
        'last-name': regLname(),
        email: regEmail(),
        phone: regPhone(),
        school: { value: selectedSchool().value },
        grade: regGrade() || { value: '9' },
        major: regMajor() || { value: selectedSchool().majors?.[0]?.value || 'other' },
        shirt: regShirt() || { value: 'M' },
        parents: 1,
        'parent1-first-name': regParentFname(),
        'parent1-last-name': regParentLname(),
        'parent1-email': regParentEmail(),
        'parent1-phone': regParentPhone(),
        'parent1-relationship': regParentRelationship(),
      },
      screen1: { teamType: 'search', teamInformation: { looking: true } },
      screen2: { checkbox1: 'on', checkbox2: 'on' },
    };

    fetch('/api/school-admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    }).then(r => r.json()).then(data => {
      setRegistering(false);
      if (!data.error) {
        alert('Student registered successfully');
        // Reset form
        setRegFname(''); setRegLname(''); setRegEmail(''); setRegPhone(''); setRegPassword('');
        setRegGrade(null); setRegMajor(null); setRegShirt(null);
        setRegParentFname(''); setRegParentLname(''); setRegParentEmail('');
        setRegParentPhone(''); setRegParentRelationship('');
        setView('list');
      } else {
        alert('Error: ' + (data.error || 'Registration failed'));
      }
    }).catch(() => {
      setRegistering(false);
      alert('Error registering student');
    });
  };

  return (
    <div class="space-y-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">School Admin Dashboard</h2>
        <div class="flex gap-2">
          {view() !== 'picker' && view() !== 'list' && (
            <Button variant="outline" onClick={() => setView('list')}>Back to List</Button>
          )}
          {view() === 'list' && schools().length > 1 && (
            <Button variant="outline" onClick={() => { setSelectedSchool(null); setView('picker'); }}>Switch School</Button>
          )}
          <Button onClick={() => props.setPage('/')}>Home</Button>
        </div>
      </div>

      {/* School Picker */}
      <Show when={view() === 'picker'}>
        <Card>
          <CardHeader>
            <CardTitle>Select School</CardTitle>
            <CardDescription>Choose which school to manage</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <For each={schools()}>{(school) => (
              <Button class="w-full" onClick={() => { setSelectedSchool(school); setView('list'); }}>
                {school.label}
              </Button>
            )}</For>
          </CardContent>
        </Card>
      </Show>

      {/* Student List + Teams */}
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
                  <TableRow class="cursor-pointer" onClick={() => openEdit(student)}>
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
                        categories: JSON.stringify(teamSelectedCategories()),
                      }
                    })
                  }).then(r => r.json()).then(d => {
                    if (!d.error) { fetchTeams(); e.target.reset(); setSaTeamLeader(null); setTeamSelectedCategories([]); }
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
                <div class="mt-3">
                  <CategoryPicker categories={availableCategories()} selected={teamSelectedCategories()} onChange={setTeamSelectedCategories} />
                </div>
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
                      class="cursor-pointer"
                      onClick={() => setSaExpandedTeamId(saExpandedTeamId() === team.id ? null : team.id)}
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
                      <TableRow>
                        <TableCell colSpan={5} class="bg-zinc-50 border-b">
                          <div class="p-4 space-y-4">
                            <div>
                              <div class="text-sm text-zinc-500 font-medium mb-2">Categories</div>
                              <CategoryPicker
                                hideLabel
                                categories={availableCategories()}
                                selected={(() => { try { return JSON.parse(team.categories || '[]'); } catch { return []; } })()}
                                onChange={(newCats) => {
                                  fetch('/api/school-admin/team/manage', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'edit', school: selectedSchool().value, teamId: team.id, data: { categories: JSON.stringify(newCats) } })
                                  }).then(() => fetchTeams());
                                }}
                              />
                            </div>
                            <div class="text-sm">
                              <span class="text-zinc-500 font-medium">Members:</span>
                              <div class="mt-1 space-y-1">
                                <For each={team.members}>{(member) => (
                                  <div class="flex items-center justify-between">
                                    <span class="text-zinc-700">{member.name} ({member.email}) {member.id === team.leaderId && <span class="text-amber-600 text-xs ml-1 font-medium">Leader</span>}</span>
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

      {/* Student Edit */}
      <Show when={view() === 'edit' && selectedStudent()}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Student</CardTitle>
            <CardDescription>Editing {selectedStudent().name}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextFieldRoot>
                <TextFieldLabel>First Name</TextFieldLabel>
                <TextField value={editFname()} onInput={(e) => setEditFname(e.target.value)} class="p-2" />
              </TextFieldRoot>
              <TextFieldRoot>
                <TextFieldLabel>Last Name</TextFieldLabel>
                <TextField value={editLname()} onInput={(e) => setEditLname(e.target.value)} class="p-2" />
              </TextFieldRoot>
            </div>
            <TextFieldRoot>
              <TextFieldLabel>Email</TextFieldLabel>
              <TextField value={editEmail()} onInput={(e) => setEditEmail(e.target.value)} class="p-2" />
            </TextFieldRoot>
            <TextFieldRoot>
              <TextFieldLabel>Phone</TextFieldLabel>
              <TextField value={editPhone()} onInput={(e) => setEditPhone(e.target.value)} class="p-2" />
            </TextFieldRoot>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                options={[{value: "9", label: "Freshman"}, {value: "10", label: "Sophomore"}, {value: "11", label: "Junior"}, {value: "12", label: "Senior"}]}
                optionValue="value"
                optionTextValue="label"
                value={editGrade() ? {value: editGrade()} : null}
                onChange={(v) => setEditGrade(v?.value || '')}
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
              >
                <TextFieldLabel>Grade</TextFieldLabel>
                <SelectTrigger>
                  <SelectValue>{state => state.selectedOption()?.label || 'Select'}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
              <Select
                options={selectedSchool()?.majors || []}
                optionValue="value"
                optionTextValue="label"
                value={editMajor() ? {value: editMajor()} : null}
                onChange={(v) => setEditMajor(v?.value || '')}
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
              >
                <TextFieldLabel>Major</TextFieldLabel>
                <SelectTrigger>
                  <SelectValue>{state => state.selectedOption()?.label || 'Select'}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
              <Select
                options={[{value: "xs", label: "XS"}, {value: "s", label: "S"}, {value: "m", label: "M"}, {value: "l", label: "L"}, {value: "xl", label: "XL"}]}
                optionValue="value"
                optionTextValue="label"
                value={editShirt() ? {value: editShirt()} : null}
                onChange={(v) => setEditShirt(v?.value || '')}
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
              >
                <TextFieldLabel>Shirt</TextFieldLabel>
                <SelectTrigger>
                  <SelectValue>{state => state.selectedOption()?.label || 'Select'}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
            <div class="flex gap-2">
              <Button onClick={saveStudent} disabled={saving()}>
                {saving() ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </Show>

      {/* Register Student */}
      <Show when={view() === 'register'}>
        <Card class="border-amber-600/30">
          <CardHeader class="bg-amber-900/20">
            <CardTitle>Register Student</CardTitle>
            <CardDescription class="text-amber-300">
              Registering student as administrator for {selectedSchool()?.label}. Student will be pre-verified.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <form onSubmit={registerStudent} class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextFieldRoot>
                  <TextFieldLabel>First Name</TextFieldLabel>
                  <TextField value={regFname()} onInput={(e) => setRegFname(e.target.value)} required class="p-2" />
                </TextFieldRoot>
                <TextFieldRoot>
                  <TextFieldLabel>Last Name</TextFieldLabel>
                  <TextField value={regLname()} onInput={(e) => setRegLname(e.target.value)} required class="p-2" />
                </TextFieldRoot>
              </div>
              <TextFieldRoot>
                <TextFieldLabel>Email</TextFieldLabel>
                <TextField type="email" value={regEmail()} onInput={(e) => setRegEmail(e.target.value)} required class="p-2" />
              </TextFieldRoot>
              <TextFieldRoot>
                <TextFieldLabel>Phone</TextFieldLabel>
                <TextField type="tel" value={regPhone()} onInput={(e) => setRegPhone(e.target.value)} required class="p-2" />
              </TextFieldRoot>
              <TextFieldRoot>
                <TextFieldLabel>Password</TextFieldLabel>
                <TextField type="password" value={regPassword()} onInput={(e) => setRegPassword(e.target.value)} required class="p-2" />
              </TextFieldRoot>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  options={[{value: "9", label: "Freshman"}, {value: "10", label: "Sophomore"}, {value: "11", label: "Junior"}, {value: "12", label: "Senior"}]}
                  optionValue="value"
                  optionTextValue="label"
                  value={regGrade()}
                  onChange={setRegGrade}
                  itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                >
                  <TextFieldLabel>Grade</TextFieldLabel>
                  <SelectTrigger>
                    <SelectValue>{state => state.selectedOption()?.label || 'Select'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
                <Select
                  options={selectedSchool()?.majors || []}
                  optionValue="value"
                  optionTextValue="label"
                  value={regMajor()}
                  onChange={setRegMajor}
                  itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                >
                  <TextFieldLabel>Major</TextFieldLabel>
                  <SelectTrigger>
                    <SelectValue>{state => state.selectedOption()?.label || 'Select'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
                <Select
                  options={[{value: "xs", label: "XS"}, {value: "s", label: "S"}, {value: "m", label: "M"}, {value: "l", label: "L"}, {value: "xl", label: "XL"}]}
                  optionValue="value"
                  optionTextValue="label"
                  value={regShirt()}
                  onChange={setRegShirt}
                  itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                >
                  <TextFieldLabel>Shirt Size</TextFieldLabel>
                  <SelectTrigger>
                    <SelectValue>{state => state.selectedOption()?.label || 'Select'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>

              <h3 class="text-lg font-medium mt-4">Parent/Guardian Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextFieldRoot>
                  <TextFieldLabel>Parent First Name</TextFieldLabel>
                  <TextField value={regParentFname()} onInput={(e) => setRegParentFname(e.target.value)} required class="p-2" />
                </TextFieldRoot>
                <TextFieldRoot>
                  <TextFieldLabel>Parent Last Name</TextFieldLabel>
                  <TextField value={regParentLname()} onInput={(e) => setRegParentLname(e.target.value)} required class="p-2" />
                </TextFieldRoot>
              </div>
              <TextFieldRoot>
                <TextFieldLabel>Parent Email</TextFieldLabel>
                <TextField type="email" value={regParentEmail()} onInput={(e) => setRegParentEmail(e.target.value)} required class="p-2" />
              </TextFieldRoot>
              <TextFieldRoot>
                <TextFieldLabel>Parent Phone</TextFieldLabel>
                <TextField type="tel" value={regParentPhone()} onInput={(e) => setRegParentPhone(e.target.value)} required class="p-2" />
              </TextFieldRoot>
              <TextFieldRoot>
                <TextFieldLabel>Relationship to Student</TextFieldLabel>
                <TextField value={regParentRelationship()} onInput={(e) => setRegParentRelationship(e.target.value)} required placeholder="Mother, Father, Guardian, etc." class="p-2" />
              </TextFieldRoot>

              <div class="flex gap-2">
                <Button type="submit" disabled={registering()}>
                  {registering() ? 'Registering...' : 'Register Student'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Show>
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

export default SchoolAdminDashboard;
