import Ui from "./ui";
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Checkbox, CheckboxControl, CheckboxDescription, CheckboxLabel } from "./components/ui/checkbox"
import Login from './components/login';
import AdminManage from './components/AdminManage';
import SchoolAdminDashboard from './components/SchoolAdminDashboard';
// import majors from './majors';
import {
	Tabs,
	TabsContent,
	TabsIndicator,
	TabsList,
	TabsTrigger,
} from "./components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { TextArea } from "./components/ui/textarea"
import { TextField, TextFieldRoot, TextFieldLabel } from "./components/ui/textfield";
import { Separator } from "./components/ui/separator"
import { createEffect, createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Label } from "@kobalte/core/select";

// const parseCSV = (csv) => {
//   const lines = csv.split('\n');
//   const headers = lines[0].split(',').map(h => h.trim());
//   console.log(lines[2].split(',').map(h => h.trim()));
//   const data = lines.slice(1).map(line => {
//     const values = line.split(',').map(v => v.trim());
//     if (values.length !== headers.length) return null; // skip invalid lines
//     return headers.reduce((obj, header, index) => {
//       obj[header] = values[index];
//       return obj;
//     }, {});
//   }).filter(row => row !== null);

//   return {
//     headers,
//     data
//   };
// }

function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');

  // Extract headers
  const headers = parseCSVLine(lines[0]);

  // Extract rows
  const data = lines.slice(2).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((key, i) => {
      const val = values[i];
      try {
        obj[key] = JSON.parse(val); // parse nested JSON strings
      } catch {
        obj[key] = val; // leave as string if not JSON
      }
    });
    return obj;
  });

  return { headers, data };
}

// Helper: parse a line handling quotes and commas inside quotes
function parseCSVLine(line) {
  const result = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"'; // escaped quote
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  result.push(field);
  return result;
}

const Dashboard = () => {
  createEffect(() => {
    if (location.pathname.startsWith('/signup/dashboard/reset')) {
      return;
    }
    fetch('/api/check-login').then(res => res.json()).then(data => {
      if (!data.loggedIn) {
        location.href = '/signup#5'
      }
    }).catch(err => {
      location.href = '/signup#5'
    });
  });

  const resend = (e) => {
    e.preventDefault();
    if (resent()) {
      return;
    }
    fetch('/api/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json()).then(data => {
      if (!data.error) {
        setResent(true);
      } else {
        setResent(false);
      }
    }).catch(err => {
      setResent(false);
    });
  }

  const resendReset = (e) => {
    e.preventDefault();
    if (resent()) {
      return;
    }
    fetch('/api/resend-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: resetToken() }),
    }).then(res => res.json()).then(data => {
      if (!data.error) {
        setResent(true);
        location.href = '/signup#5';
      } else {
        setResent(false);
      }
    }).catch(err => {
      setResent(false);
    });
  }

  const [ page, setPage ] = createSignal('');
  const [ user, setUser ] = createSignal({name: ''});
  const [ verified, setVerified ] = createSignal(true);
  const [ resent, setResent ] = createSignal(false);
  const [ countdown, setCountdown ] = createSignal(30);
  const [ resetToken, setResetToken ] = createSignal(localStorage.getItem('resetToken') || '');

  createEffect(() => {
    if (resent()) {
      let time = 30;
      const interval = setInterval(() => {
        time--;
        setCountdown(time);
        if (time <= 0) {
          clearInterval(interval);
          setResent(false);
        }
      }, 1000);
    }
  })

  createEffect(() => {
    localStorage.setItem('resetToken', resetToken());
  });

  createEffect(() => {
    if (location.pathname.startsWith('/signup/dashboard/reset')) {
      if (location.pathname.startsWith('/signup/dashboard/reset/')) {
        const token = atob(location.pathname.split('/').pop());
        setResetToken(token);
      }
      setPage('/reset');
      return;
    }
    fetch('/api/user').then(res => res.json()).then(({ user, error }) => {
      if (error) {
        if (error === 'User not verified') {
          return setVerified(false);
        }

        return location.href = '/signup#5';
      }
      setUser(user);
      setMemberCount(user.team?.maxSize || 2);
      setExperience(user.team?.experience || 'beginner');
      setCategories(user.team?.categories ? JSON.parse(user.team.categories) : []);
      setSchool(user.school || null);
      setMajor(user.major || null);
      setGrade(user.grade || null);
      setShirt(user.shirt || null);
      console.log(user);
      if (page() === '') {
        setPage((location.pathname.replace('/signup/dashboard', '')) || '/');
      }
    }).catch(err => {
      location.href = '/signup#5';
    });
  });
  
  const [ memberCount, setMemberCount ] = createSignal({value: user().team?.maxSize});
  const [ experience, setExperience ] = createSignal({value: user().team?.experience});
  const [ categories, setCategories ] = createSignal(user().team?.categories ? JSON.parse(user().team.categories) : []);
  const [ allTeams, setAllTeams ] = createSignal([]);
  const [ teams, setTeams ] = createSignal([]);
  const [ searchTeam, setSearchTeam ] = createSignal('');
  const [ joinRequest, setJoinRequest ] = createSignal(null);
  const [ school, setSchool ] = createSignal(null);
  const [ major, setMajor ] = createSignal(null);
  const [ grade, setGrade ] = createSignal(null);
  const [ shirt, setShirt ] = createSignal(null);
  const [ teamData, setTeamData ] = createSignal(null);
  const [ userData, setUserData ] = createSignal(null);
  const [ schools, setSchools ] = createSignal([]);
  const [ allMajors, setAllMajors ] = createSignal({});
  const [ availableCategories, setAvailableCategories ] = createSignal([]);

  const [ categoryInfoOpen, setCategoryInfoOpen ] = createSignal(false);
  const [ categoryInfoData, setCategoryInfoData ] = createSignal(null);

  const showCategoryInfo = (cat) => {
    setCategoryInfoData(cat);
    setCategoryInfoOpen(true);
  };

  const CategoryPicker = (props) => {
    const cats = () => props.categories || availableCategories() || [];
    return (
      <div class="space-y-2">
        <div class="text-left w-full text-sm font-medium">Award Categories</div>
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

  createEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(data => {
      setAvailableCategories(data.categories);
    }).catch(err => console.error(err));
  });

  createEffect(() => {
    fetch('/api/schools').then(res => res.json()).then(data => {
      setSchools(data.schools);
      const majorsMap = {};
      data.schools.forEach(school => {
        majorsMap[school.value] = school.majors;
      });
      setAllMajors(majorsMap);
    }).catch(err => console.error(err));
  });

  createEffect(() => {
    if (searchTeam() === '') {
      setTeams(allTeams());
      return;
    }
    const filteredTeams = allTeams().filter(team => {
      return team.name.toLowerCase().includes(searchTeam().toLowerCase()) || 
             team.members.some(member => member.name.toLowerCase().includes(searchTeam().toLowerCase()));
    });
    setTeams(filteredTeams);
  })

  createEffect(() => {
    if (page() === '') {
      return;
    }
    window.history.replaceState({}, '', '/signup/dashboard' + page());
  });

  createEffect(() => {
    if (page() === '/admin/viewer') {
      setTeamData(null);
      setUserData(null);
      fetch('/api/export-teams').then(res => res.text()).then(data => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setTeamData(parseCSV(data));
      }).catch(err => {
        console.error('Error fetching team data:', err);
      });

      fetch('/api/export-people').then(res => res.text()).then(data => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setUserData(parseCSV(data));
      }).catch(err => {
        console.error('Error fetching user data:', err);
      });
    }
  });

  createEffect(() => {
    if (!joinRequest()) return;

    fetch('/api/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamId: joinRequest().id }),
    }).then(res => res.json()).then(data => {
      if (!data.error) {
        alert('Join request sent');
        setJoinRequest(null);
        setPage('/');
        location.reload();
      } else {
        alert('Error sending join request');
        location.reload();
      }
    }).catch(err => {
      alert('Error sending join request');
      location.reload();
    });
  });

  const pages = {
    '': () => (
      <>
        Loading...
      </>
    ),
    '/reset': () => (
      <>
        <div className="text-center w-full space-y-4">
          <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
          <p className="text-gray-600 mb-4">Please enter your new password.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            if (data.password !== data.confirmPassword) {
              alert('Passwords do not match');
              return;
            }
            fetch('/api/reset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ...data, token: resetToken() }),
            }).then(res => res.json()).then(data => {
              if (!data.error) {
                location.href = '/signup/dashboard';
              } else {
                alert('Error resetting password');
              }
            }).catch(err => {
              alert('Error resetting password');
            });
          }} class="flex flex-col items-center w-full">
            <TextFieldRoot class="flex items-start flex-col justify-center w-2/3">
              <TextFieldLabel>New Password</TextFieldLabel>
              <TextField type="password" name="password" class="h-10 flex w-full text-xl p-3" required />
            </TextFieldRoot>
            <TextFieldRoot class="flex items-start flex-col justify-center w-2/3 mt-4">
              <TextFieldLabel>Confirm Password</TextFieldLabel>
              <TextField type="password" name="confirmPassword" class="h-10 flex w-full text-xl p-3" required />
            </TextFieldRoot>
            <Button type="submit" class="mt-4">Reset Password</Button>
            <Button type="button" class="mt-4" variant="outline" onClick={() => {
              location.href = '/signup#5';
            }}>Back to Login</Button>
          </form>
          {/* <p className="text-gray-500 mb-4"><a onClick={resendReset} href="#" className={(resent() ? " text-[#DBCA94]" : " text-[#f5b700] hover:underline")}>{ resent() ? `Resend in ${countdown()}s` : "Resend email"}</a></p> */}
        </div>
      </>
    ),
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
                        if (!d.error) location.reload();
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
    '/admin': () => (
      <>
        <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <Button onClick={() => setPage('/')}>Back</Button>
          </div>
          <div className="space-y-4">
            <Button onClick={() => setPage('/admin/manage')} class="w-full">Manage System (Schools, Majors, Users)</Button>
            <Button onClick={() => setPage('/admin/viewer')} class="w-full">View Data</Button>
            <div className="flex flex-row gap-4 w-full">
              <Button variant="outline" class="flex-1" onClick={() => {
                fetch('/api/export-teams', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }).then(res => res.blob()).then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `bergen-hackathon-teams-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }).catch(err => {
                  alert('Error exporting data');
                })
              }}>Export Team Data (CSV)</Button>
              <Button variant="outline" class="flex-1" onClick={() => {
                fetch('/api/export-people', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }).then(res => res.blob()).then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `bergen-hackathon-people-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }).catch(err => {
                  alert('Error exporting data');
                })
              }}>Export Signup Data (CSV)</Button>
            </div>
          </div>
        </div>
      </>
    ),
    '/admin/manage': () => (
      <AdminManage setPage={setPage} />
    ),
    '/school-admin': () => (
      <SchoolAdminDashboard setPage={setPage} />
    ),
    '/admin/viewer': () => (
      /* csv viewer n stuff */
      <>
        <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Signup Information</h2>
            <Button onClick={() => setPage('/admin')}>Back</Button>
          </div>
          <Tabs defaultValue="team-data" class="w-full">
            <TabsList>
              <TabsTrigger value="team-data" class="w-full">Team Data</TabsTrigger>
              <TabsTrigger value="signup-data" class="w-full">Signup Data</TabsTrigger>
              <TabsIndicator />
            </TabsList>
            <TabsContent value="team-data">
              {
                teamData() ? (
                  <Table>
                    <TableCaption class="space-x-2">
                      <Button variant="link" class="flex-1" onClick={() => {
                        fetch('/api/export-teams', {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        }).then(res => res.blob()).then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `bergen-hackathon-teams-${new Date().toISOString().split('T')[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        }).catch(err => {
                          alert('Error exporting data');
                        })
                      }}>Export</Button>
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        {
                          teamData().headers.map(header => (
                            <TableHead key={header} class="w-[100px]">{header}</TableHead>
                          ))
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {
                        teamData().data.map((row, index) => (
                          <TableRow key={index}>
                            {teamData().headers.map(header => (
                              <TableCell key={header} class={"font-medium" + (header === 'Categories' ? " w-[300px]" : "")}>{row[header]}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No team data available.</p>
                  </div>
                )
              }
            </TabsContent>
            <TabsContent value="signup-data">
              {
                userData() ? (
                  <Table>
                    <TableCaption class="space-x-2">
                      <Button variant="link" class="flex-1" onClick={() => {
                        fetch('/api/export-people', {
                          method: 'GET',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        }).then(res => res.blob()).then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `bergen-hackathon-people-${new Date().toISOString().split('T')[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        }).catch(err => {
                          alert('Error exporting data');
                        })
                      }}>Export</Button>
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        {
                          userData().headers.map(header => (
                            <TableHead key={header} class="w-[100px]">{header}</TableHead>
                          ))
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {
                        userData().data.map((row, index) => (
                          <TableRow key={index}>
                            {userData().headers.map(header => (
                              <TableCell key={header} class={"font-medium"}>{row[header]}</TableCell>
                            ))}
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No team data available.</p>
                  </div>
                )
              }
            </TabsContent>
          </Tabs>
        </div>
      </>
    ),
    '/create': () => (
      window.onbeforeunload = function () {
        return "Are you sure you want to leave? Your changes will not be saved.";
      },
      <>
        <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Create Team</h2>
            <Button onClick={() => setPage('/')}>Back</Button>
          </div>
          {
            user().team ? <div className="text-center p-16">
              <h2 className="text-xl font-bold mb-2">You already have a team</h2>
              <p className="text-gray-600 mb-4">You can only create one team. If you want to create a new team, please leave your current team first.</p>
              <Button onClick={() => setPage('/team')}>View Team</Button>
            </div> : (
              <div className="">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  formData.set('categories', JSON.stringify(categories()));
                  formData.set('experience', experience()?.value || 'beginner');
                  formData.set('maxSize', memberCount()?.value || '2');
                  const data = Object.fromEntries(formData.entries());
                  fetch('/api/createteam', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...data }),
                  }).then(res => res.json()).then(data => {
                    if (!data.error) {
                      window.onbeforeunload = null;
                      location.replace('/signup/dashboard/team');
                    } else {
                      alert(data.error || 'Error creating team');
                    }
                  }).catch(err => {
                    alert('Error creating team');
                  });
                }} class="flex flex-col items-start w-full">
                  <Card class="w-full">
                    <CardHeader>
                      <CardTitle class="text-xl">New Team</CardTitle>
                      <CardDescription>Fill out some basic information before completing registration.</CardDescription>
                    </CardHeader>
                    <CardContent class="flex flex-col space-y-4">
                      <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                        <TextFieldLabel>Team Name</TextFieldLabel>
                        <TextField name="name" class="h-10 flex w-full p-3" required />
                      </TextFieldRoot>
                      <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                        <TextFieldLabel>Project Description</TextFieldLabel>
                        <TextArea name="project" class="h-20 flex w-full p-3" required />
                      </TextFieldRoot>
                      <Select 
                        options={[{value: "1", label: "1 (Work Alone)"}, {value: "2", label: "2"}, {value: "3", label: "3"}, {value: "4", label: "4"}]}
                        label="Team Size"
                        optionValue="value"
                        value={memberCount()?.value ? memberCount() : {value: "2"}}
                        onChange={(checked) => {
                          if (checked) {
                            setMemberCount(checked);
                          } else {
                            setMemberCount(null);
                          }
                        }}
                        class="w-full space-y-1"
                        optionTextValue="label"
                        placeholder="Select your team size"
                        itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                      >
                        <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">Member Limit</div>
                        <SelectTrigger id="size">
                          <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                      <Select 
                        options={[{value: "beginner", label: "Beginner (0-1 years)"}, {value: "intermediate", label: "Intermediate (1-3 years)"}, {value: "advanced", label: "Advanced (3+ years)"}]}
                        label="Experience Level"
                        optionValue="value"
                        value={experience()?.value ? experience() : {value: "beginner"}}
                        onChange={(checked) => {
                          if (checked) {
                            if (checked.value === 'beginner') {
                              setExperience(null);
                              return;
                            }
                            setExperience(checked);
                          } else {
                            setExperience(null);
                          }
                        }}
                        class="w-full space-y-1"
                        optionTextValue="label"
                        placeholder="Select your experience level"
                        itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                      >
                        <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">Experience Level</div>
                        <SelectTrigger id="experience">
                          <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                      <CategoryPicker
                        categories={availableCategories()}
                        selected={categories()}
                        onChange={setCategories}
                      />
                    </CardContent>
                    <CardFooter class="pt-4">
                      <Button class="w-full h-full" type="submit">Submit</Button>
                    </CardFooter>
                  </Card>
                </form>
              </div>
            )
          }
        </div>
      </>
    ),
    '/team': () => (
      <>
        <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Team</h2>
            <div className="flex flex-row gap-4">
              {(user().team.leaderId === user().id) ? <Button onClick={() => setPage('/edit')} variant="outline">Edit</Button> : <></>}
              <Button onClick={() => {
                const confirm = window.confirm("Are you sure you want to leave your team? If you are the team leader, your team will be deleted.");
                if (!confirm) {
                  return;
                }
                fetch('/api/remove', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ id: user().id }),
                }).then(res => res.json()).then(data => {
                  if (!data.error) {
                    location.reload();
                  } else {
                    alert('Error leaving team');
                  }
                }).catch(err => {
                  alert('Error leaving team');
                });
              }} variant="outline">{
                (user().team.leaderId === user().id) ? "Delete Team" : "Leave Team"
              }</Button>
              <Button onClick={() => setPage('/')}>Back</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card class="w-auto lg:col-span-3">
              <CardHeader>
                <CardTitle class="text-xl">{user().team.name}</CardTitle>
                <CardDescription>{user().team.members.length} out of {user().team.maxSize} members</CardDescription>
              </CardHeader>
              <CardContent class="flex flex-col">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-sm text-gray-500">Project Description:</span>
                  { user().team.project }
                </div>
                <div className="flex flex-col items-start mt-2">
                  <span className="text-sm text-gray-500 mr-1">Competing Categories: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    { JSON.parse(user().team.categories).map(category => (
                      <span className="text-sm p-1 rounded-sm border">{category.label}</span>
                    )) }
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card class="w-auto lg:col-span-2">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                {/* <CardDescription></CardDescription> */}
              </CardHeader>
              <CardContent class="flex flex-col pb-0">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-sm text-gray-500">Team Leader:</span>
                  <span>{ user().team.members.find(member => member.id === user().team.leaderId).name }</span>
                </div>
                <div className="flex flex-col gap-1 items-start mt-2">
                  <span className="text-sm text-gray-500">Members:</span>
                  { user().team.members.map(member => (
                    <div class="flex items-center justify-start flex-row w-full">
                      <div class="flex flex-1 flex-col items-start">
                        <span class="text-left">{member.name}</span>
                        <span class="text-sm text-gray-700">{member.email}</span>
                        { member.phone && <span class="text-sm text-gray-700">{member.phone}</span>}
                      </div>
                      {
                        (user().id === user().team.leaderId && member.id !== user().id) &&
                          <Button class="ml-auto p-2 cursor-pointer" variant="outline" onClick={() => {
                            const confirm = window.confirm(`Are you sure you want to remove ${member.name} from the team? This action cannot be undone.`);
                            if (!confirm) {
                              return;
                            }
                            fetch('/api/remove', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ id: member.id }),
                            }).then(res => res.json()).then(data => {
                              location.reload();
                            }).catch(err => {
                              alert('Error removing member');
                            });
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </Button>
                      }
                    </div>
                  )) }
                </div>
              </CardContent>
              <CardContent class="px-0 flex flex-col pb-0">
                <div className="flex flex-1 items-center justify-between p-4 border-grey-200">
                  <div className="flex items-center flex-1">
                    <span className="text-sm text-gray-500">Join Requests:</span>
                    <span className="text-sm ml-2">{user().team.requests?.length || 0}</span>
                    {
                      user().team.isLeader && <Button class="ml-auto" variant="outline" onClick={() => setPage('/requests')}>View</Button>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    ),
    '/join': () => (
      fetch('/api/teams').then(res => res.json()).then(data => {
        console.log(data);
        if (data.error) {
          console.error(data.error);
          return;
        }
        setAllTeams(data.teams);
        setTeams(data.teams);
      }).catch(err => {
        console.error('Error fetching teams:', err);
      }),
      <>
        <div className="ext-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Join a Team</h2>
            <div className="flex flex-row gap-4">
              <Button onClick={() => setPage('/')}>Back</Button>
            </div>
          </div>
          <div className="space-y-6">
            {
              allTeams().length > 0 ? (<>
                <TextFieldRoot>
                  <TextFieldLabel htmlFor="team-search">Search for a Team</TextFieldLabel>
                  <TextField
                    id="team-search"
                    placeholder="Enter team name or member name"
                    name="team-search"
                    value={searchTeam()}
                    onInput={(e) => {
                      setSearchTeam(e.target.value);
                    }}
                  />
                </TextFieldRoot>
                { teams().length ? teams().map(team => (
                  <Card class="w-auto md:col-span-1 p-3">
                    <CardHeader class="p-3">
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.members.length} member{team.members.length == 1 ? '' : 's'}</CardDescription>
                    </CardHeader>
                    <CardContent class="flex flex-col p-3">
                      <span className="text-sm text-gray-500">Leader:</span>
                      {team.members.find(member => member.id === team.leaderId).name}
                    </CardContent>
                    <CardFooter class="p-3">
                      <Button onClick={() => {setJoinRequest(team);}} disabled={!!joinRequest()} class="w-full h-full">Request</Button>
                    </CardFooter>
                  </Card>
                )) : <div className="text-center">
                <p className="text-gray-500">No teams available</p>
              </div>}</>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500">No teams available</p>
                </div>
              )
            }
          </div>
        </div>
      </>
    ),
    '/edit': () => (
      window.onbeforeunload = function () {
        return "Are you sure you want to leave? Your changes will not be saved.";
      },
      <>
        <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Edit Team</h2>
            <Button onClick={() => setPage('/team')}>Back</Button>
          </div>
          {
            (user().team.leaderId === user().id) ? <div className="">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                formData.set('categories', JSON.stringify(categories()));
                formData.set('experience', experience()?.value || user().team.experience);
                formData.set('maxSize', memberCount()?.value || user().team.maxSize);
                const data = Object.fromEntries(formData.entries());
                fetch('/api/edit', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ ...data, id: user().team.id }),
                }).then(res => res.json()).then(data => {
                  if (!data.error) {
                    window.onbeforeunload = null;
                    location.reload();
                  } else {
                    alert(data.error || 'Error updating team');
                  }
                }).catch(err => {
                  alert('Error updating team');
                });
              }} class="flex flex-col items-start w-full">
                <Card class="w-full">
                  <CardHeader>
                    <CardTitle class="text-xl">{user().team.name}</CardTitle>
                    <CardDescription>{user().team.members.length} out of {user().team.maxSize} members</CardDescription>
                  </CardHeader>
                  <CardContent class="flex flex-col space-y-4">
                    <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                      <TextFieldLabel>Team Name</TextFieldLabel>
                      <TextField name="name" class="h-10 flex w-full p-3" required value={user().team.name} />
                    </TextFieldRoot>
                    <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                      <TextFieldLabel>Project Description</TextFieldLabel>
                      <TextArea name="project" class="h-20 flex w-full p-3" required value={user().team.project} />
                    </TextFieldRoot>
                    <Select 
                      options={[{value: "1", label: "1 (Work Alone)"}, {value: "2", label: "2"}, {value: "3", label: "3"}, {value: "4", label: "4"}]}
                      label="Team Size"
                      optionValue="value"
                      value={memberCount()?.value ? memberCount() : {value: user().team.maxSize}}
                      onChange={(checked) => {
                        if (checked) {
                          if (parseInt(checked.value) < user().team.members.length) {
                            alert(`You cannot set the team size to ${checked.value} because you have ${user().team.members.length} members.`);
                            return;
                          } else {
                            setMemberCount(checked);
                          }
                        } else {
                          setMemberCount(null);
                        }
                      }}
                      class="w-full space-y-1"
                      optionTextValue="label"
                      placeholder="Select your team size"
                      itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                    >
                      <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">Member Limit</div>
                      <SelectTrigger id="size">
                        <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                    <Select 
                      options={[{value: "beginner", label: "Beginner (0-1 years)"}, {value: "intermediate", label: "Intermediate (1-3 years)"}, {value: "advanced", label: "Advanced (3+ years)"}]}
                      label="Experience Level"
                      optionValue="value"
                      value={experience()?.value ? experience() : {value: user().team.experience}}
                      onChange={(checked) => {
                        console.log(checked);
                        if (checked) {
                          setExperience(checked);
                        } else {
                          setExperience(null);
                        }
                      }}
                      class="w-full space-y-1"
                      optionTextValue="label"
                      placeholder="Select your experience level"
                      itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                    >
                      <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">Experience Level</div>
                      <SelectTrigger id="experience">
                        <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                    <CategoryPicker
                      categories={availableCategories()}
                      selected={categories()}
                      onChange={setCategories}
                    />
                  </CardContent>
                  <CardFooter class="pt-4">
                    <Button class="w-full h-full" type="submit">Save</Button>
                  </CardFooter>
                </Card>
              </form>
            </div> : <div className="text-center p-16">
              <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
              <p className="text-gray-600 mb-4">Only the team leader can edit the team.</p>
            </div>
          }
        </div>
      </>
    ),
    '/manage': () => (
      window.onbeforeunload = function () {
        return "Are you sure you want to leave? Your changes will not be saved.";
      },
      <>
        <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Manage Account</h2>
            <div className="flex flex-row gap-4">
              <Button variant="outline" onClick={() => {
                if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  return;
                }

                fetch('/api/delete', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ id: user().id }),
                }).then(res => res.json()).then(data => {
                  if (!data.error) {
                    alert('Your account has been deleted successfully.');
                    location.href = '/';
                  } else {
                    alert('Error deleting account');
                  }
                }).catch(err => {
                  alert('Error deleting account');
                });
              }}>Delete Account</Button>
              <Button onClick={() => setPage('/')}>Back</Button>
            </div>
          </div>
          <div className="">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              formData.set('categories', JSON.stringify(categories()));
              formData.set('experience', experience()?.value || user().team.experience);
              formData.set('maxSize', memberCount()?.value || user().team.maxSize);
              const data = Object.fromEntries(formData.entries());
              fetch('/api/edit', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...data, id: user().team.id }),
              }).then(res => res.json()).then(data => {
                if (!data.error) {
                  window.onbeforeunload = null;
                  location.reload();
                } else {
                  alert(data.error || 'Error updating team');
                }
              }).catch(err => {
                alert('Error updating team');
              });
            }} class="flex flex-col items-start w-full">
              <Card class="w-full">
                <CardHeader>
                  <CardTitle class="text-xl">{user().name}</CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col space-y-4">
                  <div className="flex flex-row gap-4 w-full">
                    <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                      <TextFieldLabel>First Name</TextFieldLabel>
                      <TextField name="name" class="h-10 flex w-full p-3" required value={user().fname} />
                    </TextFieldRoot>
                    <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                      <TextFieldLabel>Last Name</TextFieldLabel>
                      <TextField name="name" class="h-10 flex w-full p-3" required value={user().lname} />
                    </TextFieldRoot>
                  </div>
                  <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                    <TextFieldLabel>Email</TextFieldLabel>
                    <TextField name="name" class="h-10 flex w-full p-3" required value={user().email} />
                  </TextFieldRoot>
                  <TextFieldRoot class="flex items-start flex-col justify-center w-full">
                    <TextFieldLabel>Phone Number</TextFieldLabel>
                    <TextField id="phone" type="tel" name="phone" value={user().phone} placeholder="+1 (201) 555-0123" on:keydown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                        return;
                      }
                      e.preventDefault();
                      let val = e.target._value || '';
                      if (!e.target._value) {
                        e.target._value = '';
                      }
                      let pos = ((oField) => {
                        var iCaretPos = 0;
                      
                        if (document.selection) {
                          oField.focus();
                          var oSel = document.selection.createRange();
                          oSel.moveStart('character', -oField.value.length);
                          iCaretPos = oSel.text.length;
                        } else if (oField.selectionStart || oField.selectionStart == '0')
                          iCaretPos = oField.selectionDirection=='backward' ? oField.selectionStart : oField.selectionEnd;

                        return iCaretPos;
                      })(e.target);
                      console.log('pos', pos);
                      let _pos = pos;
                      if (pos <= 4) {
                        console.log('in the region code');
                        pos = 0;
                        _pos = 4;
                      } else if (pos > 4 && pos < ((5 + val.length) > 8 ? 8 : (5 + val.length))) {
                        console.log('deleting region code')
                        pos = pos - 4;
                      } else if (pos == (5 + (val.length > 3 ? 3 : val.length)) || pos == (val.length > 3 ? 9 : (6 + val.length))) {
                        if (val.length < 3) {
                          console.log('area after region code, short')
                          pos = val.length - 1 || 1;
                        } else {
                          console.log('area after region code')
                          pos = 3;
                        }
                      } else if (pos > 9 && pos < 13) {
                        console.log('second part of number')
                        pos = pos - 6;
                      } else if (pos == 13) {
                        console.log('area after second part of number')
                        pos = 6;
                      } else if (pos > 13 && pos < 18) {
                        console.log('third part of number')
                        pos = pos - 7;
                      } else if (pos > 18) {
                        console.log('area after fourth part of number')
                        pos = pos - 8;
                      } else if (e.key === ' ') {
                        return;
                      }
                      console.log('new pos', pos, _pos);
                      if (e.key.match(/[0-9]/)) {
                        if (val.length === 10) {
                          return;
                        }
                        if (val.length === 0 && _pos === 0) {
                          _pos += 5;
                        } else {
                          _pos += 1;
                        }
                        val = val.slice(0, pos) + e.key + val.slice(pos);
                        if (val.length >= 3 && _pos === 7) {
                          _pos += 2;
                        }
                        if (val.length >= 6 && _pos === 11) {
                          _pos += 1;
                        }
                        if (val.length === 7) {
                          _pos += 1;
                        }
                        e.target._value = val;
                        e.target.value = val.replace(/^([0-9]{1,3})([0-9]{1,3})?([0-9]{1,4})?$/, (match, p1, p2, p3) => {
                          let final = '';
                          
                          if (p1) final += `+1 (${p1}) `;
                          if (p2) final += `${p2}`;
                          if (p3) final += `-${p3}`;
                      
                          return final;
                        });
                      }
                      if (e.key === 'Backspace') {
                        if (pos === 0) {
                          return;
                        }
                        if (val.length > 3 && _pos === 9) {
                          _pos -= 2;
                        } else if (val.length > 3 && _pos === 8) {
                          _pos -= 1;
                        }
                        if (val.length > 6 && _pos === 13) {
                          _pos -= 1;
                        }
                        val = val.slice(0, pos - 1) + val.slice(pos);
                        _pos -= 1;
                        //if (val.length > 3 && pos === 
                        e.target._value = val;
                        e.target.value = val.replace(/^([0-9]{1,3})([0-9]{1,3})?([0-9]{1,4})?$/, (match, p1, p2, p3) => {
                          let final = '';
                          
                          if (p1) final += `+1 (${p1})`;
                          if (p2) final += ` ${p2}`;
                          if (p3) final += `-${p3}`;
                      
                          return final;
                        });
                      }
                      if (e.key === 'Delete') {
                        val = val.slice(0, pos) + val.slice(pos + 1);
                        _pos = _pos;
                        e.target._value = val;
                        e.target.value = val.replace(/^([0-9]{1,3})([0-9]{1,3})?([0-9]{1,4})?$/, (match, p1, p2, p3) => {
                          let final = '';
                          
                          if (p1) final += `+1 (${p1})`;
                          if (p2) final += ` ${p2}`;
                          if (p3) final += `-${p3}`;
                      
                          return final;
                        });
                      }

                      e.target.setSelectionRange(_pos, _pos);
                      e.target.focus();
                    }} />
                  </TextFieldRoot>
                  <div className="flex flex-row gap-4 w-full">
                    <Select 
                      required
                      options={schools()}
                      label="School"
                      class="flex-1"
                      optionValue="value"
                      optionTextValue="label"
                      placeholder="Select your school"
                      itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                      value={school() ? {value: school()} : null}
                      onChange={(checked) => {
                        if (checked) {
                          setSchool(checked.value);
                        } else {
                          setSchool(null);
                        }
                      }}
                    >
                      <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">School</div>
                      <SelectTrigger id="experience">
                        <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                    <Select 
                      required
                      options={allMajors()[school()] || []}
                      disabled={!school()}
                      value={major() ? {value: major()} : null}
                      label="Major"
                      class="flex-1"
                      optionValue="value"
                      optionTextValue="label"
                      placeholder="Select your major"
                      itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                      onChange={(checked) => {
                        if (checked) {
                          setMajor(checked.value);
                        } else {
                          setMajor(null);
                        }
                      }}
                    >
                      <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">Major</div>
                      <SelectTrigger id="experience">
                        <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  </div>
                  <Select 
                    options={[{value: "9", label: "Freshman"}, {value: "10", label: "Sophomore"}, {value: "11", label: "Junior"}, {value: "12", label: "Senior"}]}
                    class="w-full space-y-1"
                    label="Grade"
                    disabled={!school()}
                    optionValue="value"
                    value={grade() ? {value: grade()} : null}
                    onChange={(checked) => {
                      if (checked) {
                        setGrade(checked.value);
                      } else {
                        setGrade(null);
                      }
                    }}
                    optionTextValue="label"
                    placeholder="Select your grade"
                    itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                  >
                    <div className="text-left w-full text-sm data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 font-medium data-[invalid]:text-destructive">Grade</div>
                    <SelectTrigger id="size">
                      <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </CardContent>
                <CardFooter class="pt-4">
                  <Button class="w-full h-full" type="submit">Save</Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      </>
    ),
    '/requests': () => (
      <>
        <Show when={user().team.isLeader} fallback={
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You are not the team leader</h2>
            <p className="text-gray-600 mb-4">Only the team leader can view join requests.</p>
            <Button onClick={() => setPage('/team')}>Back</Button>
          </div>
        }>
          <div className="text-center mt-[calc(var(--spacing)_*_-2)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Join Requests</h2>
              <Button onClick={() => setPage('/team')}>Back</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              { user().team.requests?.length ? user().team.requests.filter(request => request.user.verified).map(request => (
                <Card class="w-auto md:col-span-1">
                  <CardHeader>
                    <CardTitle>{request.user.name}</CardTitle>
                    <CardDescription class="break-words">{request.user.email}</CardDescription>
                  </CardHeader>
                  { request.message && (
                  <CardContent class="flex flex-col">
                    <span className="text-sm text-gray-500">Message:</span>
                    { request.project }
                  </CardContent> ) }
                  <CardFooter class="pt-6 space-x-4">
                    <Button class="w-full h-full" onClick={() => {
                      fetch('/api/accept', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id: request.id }),
                      }).then(res => res.json()).then(data => {
                        if (data.error) {
                          alert(data.error);
                          return;
                        }
                        setPage('/team');
                        location.reload();
                      }).catch(err => {
                        alert('Error accepting request');
                      });
                    }}>Accept</Button>
                    <Button type="outline" class="w-full h-full" onClick={() => {
                      if (!confirm(`Are you sure you want to reject ${request.user.name}'s request?`)) {
                        return;
                      }
                      fetch('/api/reject', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id: request.id }),
                      }).then(res => res.json()).then(data => {
                        if (data.error) {
                          alert(data.error);
                          return;
                        }
                        setPage('/team');
                        location.reload();
                      }).catch(err => {
                        alert('Error rejecting request');
                      });
                    }}>Reject</Button>
                  </CardFooter>
                </Card>
              )) : (
                <div className="text-left">
                  <p className="text-gray-500">No join requests</p>
                </div>
              ) }
            </div>
          </div>
        </Show>
      </>
    ),
  }

  return (
    <>
      <Ui>
        <main className="container mx-auto py-8 px-4">
          {
            verified() ? (
              <Card class={"mx-auto overflow-hidden" + (page() === '/admin/viewer' ? " max-w-6xl" : " max-w-4xl")}>
                <CardHeader class="bg-[#1a2533] text-white">
                  <CardTitle class="flex flex-row items-center py-0 gap-2">
                    {page() === "/reset" ? <>Reset Password</> : <>Welcome Back, {user().name}!</>}
                    <Button variant="outline" class="ml-auto" onClick={() => {
                      location.href = '/';
                    }}>Home</Button>
                    <Button variant="outline" class="" onClick={() => {
                      fetch('/api/logout').then(() => location.href = '/signup');
                    }}>Logout</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent class="pt-6">
                  { pages[page()]() }
                </CardContent>
              </Card>
            ) : (
              <Card class="max-w-4xl mx-auto overflow-hidden">
                <CardHeader class="bg-[#1a2533] text-white">
                  <CardTitle>Account Verification Required</CardTitle>
                </CardHeader>
                <CardContent class="pt-6 flex flex-col items-center">
                  <p className="text-black mb-4 text-lg font-bold">Enter Verification Code:</p>
                  <p className="text-gray-500 mb-4">Please enter the code sent to your email address to verify your account.</p>
                  <div className="space-y-1 flex gap-2 max-w-96 min-h-24 items-center flex-row" onPaste={(e) => {
                    e.preventDefault();
                    const data = e.clipboardData.getData('text/plain');
                    console.log(data);
                    if (data.length === 6) {
                      [...Array(6).keys()].forEach(i => {
                        const input = document.querySelector(`input[name="code-${i}"]`);
                        input.value = data[i];
                      });
                      const code = [...Array(6).keys()].map(i => document.querySelector(`input[name="code-${i}"]`).value).join('');
                      fetch('/api/verify', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code }),
                      }).then(res => res.json()).then(data => {
                        if (!data.error) {
                          location.href = '/signup/dashboard';
                        } else {
                          alert('Invalid code');
                        }
                      }).catch(err => {
                        alert('Error verifying code');
                      });
                    }
                  }} onKeyUp={(e) => {
                    if (e.target.value.length === 1 && e.target.name.split('-')[1] == 5) {
                      const code = [...Array(6).keys()].map(i => document.querySelector(`input[name="code-${i}"]`).value).join('');
                      fetch('/api/verify', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code }),
                      }).then(res => res.json()).then(data => {
                        if (!data.error) {
                          location.href = '/signup/dashboard';
                        } else {
                          alert('Invalid code');
                        }
                      }).catch(err => {
                        alert('Error verifying code');
                      });
                    }
                  }} onKeyDown={(e) => {
                    if (e.target.selectionStart === 1 && "1234567890".split("").includes(e.key)) {
                      e.preventDefault();
                      const index = e.target.name.split('-')[1];
                      const nextInput = document.querySelector(`input[name="code-${parseInt(index) + 1}"]`);
                      if (nextInput) {
                        nextInput.value = e.key;
                        nextInput.focus();
                      }
                      return;
                    }

                    if (e.target.selectionStart === 0 && "1234567890".split("").includes(e.key)) {
                      e.preventDefault();
                      e.target.value = e.key;
                      e.target.focus();
                      return;
                    }

                    if (e.key === 'Backspace' && e.target.selectionStart === 0) {
                      e.preventDefault();
                      const range = e.target.value.length;
                      const index = e.target.name.split('-')[1];
                      const prevInput = document.querySelector(`input[name="code-${parseInt(index) - 1}"]`);

                      if (prevInput) {
                        prevInput.value = '';
                        prevInput.focus();
                      }
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const code = [...Array(6).keys()].map(i => document.querySelector(`input[name="code-${i}"]`).value).join('');
                      fetch('/api/verify', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ code }),
                      }).then(res => res.json()).then(data => {
                        if (!data.error) {
                          location.href = '/signup/dashboard';
                        } else {
                          alert('Invalid code');
                        }
                      }).catch(err => {
                        alert('Error verifying code');
                      });
                    }
                    if (e.key === 'ArrowLeft') {
                      const index = e.target.name.split('-')[1];
                      if (index > 0) {
                        e.preventDefault();
                        const prevInput = document.querySelector(`input[name="code-${parseInt(index) - 1}"]`);
                        if (prevInput) {
                          prevInput.focus();
                          prevInput.setSelectionRange(1, 1);
                        }
                      }
                    }
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      const index = e.target.name.split('-')[1];
                      if (index < 5) {
                        const nextInput = document.querySelector(`input[name="code-${parseInt(index) + 1}"]`);
                        if (nextInput) {
                          nextInput.focus();
                          nextInput.setSelectionRange(1, 1);
                        }
                      }
                    }
                  }}>
                    {
                      [...Array(6).keys()].map((_, i) =>
                        <TextFieldRoot class="flex items-center justify-center">
                          <TextField name={`code-${i}`} class="h-20 flex w-full text-xl p-0 text-center" required maxLength={1} />
                        </TextFieldRoot>
                      )
                    }
                  </div>
                  <p className="text-gray-500 mb-4"><a onClick={resend} href="#" className={(resent() ? " text-[#DBCA94]" : " text-[#f5b700] hover:underline")}>{ resent() ? `Resend in ${countdown()}s` : "Resend code"}</a></p>
                </CardContent>
              </Card>
            )
          }

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Questions?{" "}
              <a href="/contact" className="text-[#f5b700] hover:underline">
                Contact us
              </a>
            </p>
          </div>

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
        </main>
      </Ui>
    </>
  );
};

export default Dashboard;
