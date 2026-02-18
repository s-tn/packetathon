import Ui from "./ui";
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Checkbox, CheckboxControl, CheckboxDescription, CheckboxLabel } from "./components/ui/checkbox"
import Login from './components/login';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Progress } from "./components/ui/progress";
// import majors from './majors';
import {
	Tabs,
	TabsContent,
	TabsIndicator,
	TabsList,
	TabsTrigger,
} from "./components/ui/tabs";
import { TextArea } from "./components/ui/textarea"
import { TextField, TextFieldRoot, TextFieldLabel } from "./components/ui/textfield";
import { Separator } from "./components/ui/separator"
import { Label } from "@kobalte/core/select";
import { createEffect, createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import Register from "./components/register";

const App = () => {
  const [ schools, setSchools ] = createSignal([]);
  const [ majors, setMajors ] = createSignal({});

  createEffect(() => {
    fetch('/api/schools').then(res => res.json()).then(data => {
      setSchools(data.schools);
      const majorsMap = {};
      data.schools.forEach(school => {
        majorsMap[school.value] = school.majors;
      });
      setMajors(majorsMap);
    }).catch(err => console.error(err));
  });

  const [ availableCategories, setAvailableCategories ] = createSignal([]);
  const [ categoryInfoOpen, setCategoryInfoOpen ] = createSignal(false);
  const [ categoryInfoData, setCategoryInfoData ] = createSignal(null);

  createEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(data => {
      setAvailableCategories(data.categories);
    }).catch(err => console.error(err));
  });

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

  let _data = {
    screen0: null,
    screen1: null,
    screen2: null
  };
  if (localStorage.getItem('screen0')) {
    _data.screen0 = JSON.parse(localStorage.getItem('screen0'));
  }
  if (localStorage.getItem('screen1')) {
    _data.screen1 = JSON.parse(localStorage.getItem('screen1'));
  }
  if (localStorage.getItem('screen2')) {
    _data.screen2 = JSON.parse(localStorage.getItem('screen2'));
  }

  const [ data, setData ] = createSignal(_data);

  let [ section, _setSection ] = createSignal(0);

  const setSection = (value) => {
    _setSection(value);
    window.history.pushState(null, null, `#${value}`);
  };

  const [ parents, setParents ] = createSignal(data().screen0?.parents || 1);
  const [ parent1FirstName, setParent1FirstName ] = createSignal(data().screen0?.parent1FirstName || '');
  const [ parent1LastName, setParent1LastName ] = createSignal(data().screen0?.parent1LastName || '');
  const [ parent1Email, setParent1Email ] = createSignal(data().screen0?.parent1Email || '');
  const [ parent1Phone, setParent1Phone ] = createSignal(data().screen0?.parent1Phone || '');
  const [ parent1Relationship, setParent1Relationship ] = createSignal(data().screen0?.parent1Relationship || '');
  const [ parent2FirstName, setParent2FirstName ] = createSignal(data().screen0?.parent2FirstName || '');
  const [ parent2LastName, setParent2LastName ] = createSignal(data().screen0?.parent2LastName || '');
  const [ parent2Email, setParent2Email ] = createSignal(data().screen0?.parent2Email || '');
  const [ parent2Phone, setParent2Phone ] = createSignal(data().screen0?.parent2Phone || '');
  const [ parent2Relationship, setParent2Relationship ] = createSignal(data().screen0?.parent2Relationship || '');
  const [ email, setEmail ] = createSignal(data().screen0?.email || '');
  const [ school, setSchool ] = createSignal(data().screen0?.school);
  const [ major, setMajor ] = createSignal(data().screen0?.major);
  const [ grade, setGrade ] = createSignal(data().screen0?.grade);
  const [ shirt, setShirt ] = createSignal(data().screen0?.shirt);
  const [ checkbox1, setCheckbox1 ] = createSignal(data().screen2?.checkbox1);
  const [ checkbox2, setCheckbox2 ] = createSignal(data().screen2?.checkbox2);
  const [ checkbox3, setCheckbox3 ] = createSignal(null);
  const [ teamType, setTeamType ] = createSignal(data().screen1?.teamType || 'join');
  const [ memberCount, setMemberCount ] = createSignal(data().screen1?.teamInformation?.memberCount);
  const [ experience, setExperience ] = createSignal(data().screen1?.teamInformation?.experience);
  const [ categories, setCategories ] = createSignal(data().screen1?.teamInformation?.categories);
  const [ showNext, _setShowNext ] = createSignal(true);
  const setShowNext = (value) => {
    console.trace(value);
    _setShowNext(value);
  }
  const [ unlocked, setUnlocked ] = createSignal([false, false, false, false, false].map((_, i) => i <= section()));
  const [ _teams, _setTeams ] = createSignal([]);
  const [ teams, setTeams ] = createSignal([]);
  const [ searchTeam, setSearchTeam ] = createSignal('');
  const [ joinRequest, setJoinRequest ] = createSignal(null);
  const [ firstTab, setFirstTab ] = createSignal('signup');
  const [ selfRegBlocked, setSelfRegBlocked ] = createSignal(null);

  // Check self-registration when school changes
  createEffect(() => {
    const selectedSchool = school();
    if (selectedSchool && schools().length > 0) {
      const schoolData = schools().find(s => s.value === selectedSchool.value);
      if (schoolData && schoolData.allowSelfRegistration === false) {
        const adminContacts = schoolData.admins?.map(a => a.user?.email).filter(Boolean).join(', ') || 'your school administrator';
        setSelfRegBlocked({ schoolLabel: schoolData.label, adminContacts });
      } else {
        setSelfRegBlocked(null);
      }
    } else {
      setSelfRegBlocked(null);
    }
  });

  createEffect(() => {
    setTeams(_teams().filter(team => {
      if (searchTeam() === '') {
        return true;
      }
      return team.name.toLowerCase().includes(searchTeam().toLowerCase()) || team.members.find(member => member.name.toLowerCase().includes(searchTeam().toLowerCase()));
    }));
  });

  const switchToSection = (i) => {
    let j = section();

    console.log(i, j);

    while (j < sections.length - 1) {
      let _s = section();
      console.log(_s)
      let _a = window.alert;
      window.alert = () => {};
      document.querySelector('form')?.requestSubmit();
      window.alert = _a;
      if (section() === _s) {
        setUnlocked(unlocked().map((_, i) => i <= j));
        console.log('section', i, j);
        if (i > j) {
          i = j;
        }
        break;
      }
      j++;
    }

    if (i === 1 && teamType() === 'join') {
      setShowNext(false);
    } else if (firstTab() === 'signup') {
      setShowNext(true);
    }

    setSection(i);

    window.scrollTo(0, 0);
  }

  createEffect(() => {
    if (section() === 0 && firstTab() === 'signedup') {
      setShowNext(false);
    }
  })

  createEffect(() => {
    fetch('/api/check-login').then(res => res.json()).then(data => {
      if (data.loggedIn) {
        return location.href = '/signup/dashboard'
      }

      if (window.location.hash && parseInt(window.location.hash.replace('#', '')) === 5) {
        location.hash = "";
        setFirstTab('signedup');
        setShowNext(false);
      }

      switchToSection(window.location.hash ? parseInt(window.location.hash.replace('#', '')) : 0);
    }).catch(err => {
      console.error(err);
    });

    fetch('/api/teams').then(res => res.json()).then(data => {
      _setTeams(data.teams);
    });
  });

  const sections = [
    () => <>
      <Tabs defaultValue="signup" class="w-full" onChange={(e) => {
        setFirstTab(e);
        if (e === 'signedup') {
          setShowNext(false);
        } else {
          setShowNext(true);
        }
      }} value={firstTab()}>
        <TabsList>
          <TabsTrigger value="signup">New Registration</TabsTrigger>
          <TabsTrigger value="signedup">Already Registered?</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="signup" class="space-y-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel htmlFor="first-name">First Name</TextFieldLabel>
                <TextField id="first-name" name="first-name" value={data().screen0?.['first-name']} placeholder="John" required />
              </TextFieldRoot>
            </div>
            <div className="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel htmlFor="last-name">Last Name</TextFieldLabel>
                <TextField id="last-name" name="last-name" value={data().screen0?.['last-name']} placeholder="Doe" required />
              </TextFieldRoot>
            </div>
          </div>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="email">Email Address</TextFieldLabel>
              <TextField id="email" type="email" name="email" value={email()} onInput={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" required />
            </TextFieldRoot>
          </div>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Phone Number</TextFieldLabel>
              <TextField id="phone" type="tel" name="phone" value={data().screen0?.phone} placeholder="+1 (201) 555-0123" on:keydown={(e) => {
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Select 
                required
                options={schools()}
                label="School"
                optionValue="value"
                optionTextValue="label"
                placeholder="Select your school"
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                value={school()}
                onChange={(checked) => {
                  if (checked) {
                    setSchool(checked);
                  } else {
                    setSchool(null);
                  }
                }}
              >
                <Label htmlFor="school">School</Label>
                <SelectTrigger id="experience">
                  <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
            <div className="space-y-2">
              <Select 
                required
                options={majors()[school()?.value] || []}
                disabled={!school()}
                value={major()}
                label="Major"
                optionValue="value"
                optionTextValue="label"
                placeholder="Select your major"
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                onChange={(checked) => {
                  if (checked) {
                    setMajor(checked);
                  } else {
                    setMajor(null);
                  }
                }}
              >
                <Label htmlFor="school">Major</Label>
                <SelectTrigger id="experience">
                  <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
            {selfRegBlocked() && (
              <div class="col-span-2 p-4 rounded-lg border border-amber-500/50 bg-amber-900/20">
                <p class="font-semibold text-amber-300">Registration Managed by School</p>
                <p class="text-sm text-amber-200/80 mt-1">
                  Registration for {selfRegBlocked().schoolLabel} is managed by your school administrators. Please contact {selfRegBlocked().adminContacts} to register.
                </p>
              </div>
            )}
            <div className="space-y-2 col-span-2">
              <Select
                required
                options={[{value: "9", label: "Freshman"}, {value: "10", label: "Sophomore"}, {value: "11", label: "Junior"}, {value: "12", label: "Senior"}]}
                label="Grade/Year"
                optionValue="value"
                disabled={!school()}
                value={grade()}
                optionTextValue="label"
                placeholder="Select your grade"
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                onChange={(checked) => {
                  if (checked) {
                    setGrade(checked);
                  } else {
                    setGrade(null);
                  }
                }}
              >
                <Label htmlFor="school">Grade</Label>
                <SelectTrigger id="experience">
                  <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Select 
                required
                options={[{value: "xs", label: "XS"}, {value: "s", label: "S"}, {value: "m", label: "M"}, {value: "l", label: "L"}, {value: "xl", label: "XL"}]}
                label="Shirt Size"
                optionValue="value"
                optionTextValue="label"
                value={shirt()}
                placeholder="Select your T-shirt size"
                itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                onChange={(checked) => {
                  if (checked) {
                    setShirt(checked);
                  } else {
                    setShirt(null);
                  }
                }}
              >
                <Label htmlFor="school">T-Shirt Size</Label>
                <SelectTrigger id="experience">
                  <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
            <h3 className="text-lg font-medium col-span-2">Parent Information</h3>
            <div className="flex flex-col col-span-2 gap-4">
              <Card>
                <CardHeader class="">
                  <CardTitle>Parent 1</CardTitle>
                </CardHeader>
                <CardContent class="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 space-x-2">
                    <div className="space-y-2">
                      <TextFieldRoot>
                        <TextFieldLabel htmlFor="parent1-first-name">First Name</TextFieldLabel>
                        <TextField id="parent1-first-name" name="parent1-first-name" value={data().screen0?.['parent1-first-name']} placeholder="Jane" required />
                      </TextFieldRoot>
                    </div>
                    <div className="space-y-2">
                      <TextFieldRoot>
                        <TextFieldLabel htmlFor="parent1-last-name">Last Name</TextFieldLabel>
                        <TextField id="parent1-last-name" name="parent1-last-name" value={data().screen0?.['parent1-last-name']} placeholder="Doe" required />
                      </TextFieldRoot>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <TextFieldRoot>
                      <TextFieldLabel htmlFor="parent1-email">Email Address</TextFieldLabel>
                      <TextField id="parent1-email" type="email" name="parent1-email" value={data().screen0?.['parent1-email']} placeholder="jane.doe@example.com" required />
                    </TextFieldRoot>
                  </div>
                  <div className="space-y-2">
                    <TextFieldRoot>
                      <TextFieldLabel htmlFor="parent1-phone">Phone Number</TextFieldLabel>
                      <TextField id="parent1-phone" type="tel" name="parent1-phone" required value={data().screen0?.['parent1-phone']} placeholder="+1 (201) 555-0123"  on:keydown={(e) => {
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
                  </div>
                  <div className="space-y-2">
                    <TextFieldRoot>
                      <TextFieldLabel htmlFor="parent1-relationship">Relationship to Student</TextFieldLabel>
                      <TextField id="parent1-relationship" name="parent1-relationship" value={data().screen0?.['parent1-relationship']} placeholder="Mother, Father, Guardian, etc." required />
                    </TextFieldRoot>
                  </div>
                </CardContent>
              </Card>
              { parents() === 2 && (
                <Card>
                  <CardHeader class="">
                    <CardTitle>Parent 2</CardTitle>
                  </CardHeader>
                  <CardContent class="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 space-x-2">
                      <div className="space-y-2">
                        <TextFieldRoot>
                          <TextFieldLabel htmlFor="parent2-first-name">First Name</TextFieldLabel>
                          <TextField id="parent2-first-name" name="parent2-first-name" value={data().screen0?.['parent2-first-name']} placeholder="Jane" required />
                        </TextFieldRoot>
                      </div>
                      <div className="space-y-2">
                        <TextFieldRoot>
                          <TextFieldLabel htmlFor="parent2-last-name">Last Name</TextFieldLabel>
                          <TextField id="parent2-last-name" name="parent2-last-name" value={data().screen0?.['parent2-last-name']} placeholder="Doe" required />
                        </TextFieldRoot>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <TextFieldRoot>
                        <TextFieldLabel htmlFor="parent2-email">Email Address</TextFieldLabel>
                        <TextField id="parent2-email" type="email" name="parent2-email" value={data().screen0?.['parent2-email']} placeholder="jane.doe@example.com" required />
                      </TextFieldRoot>
                    </div>
                    <div className="space-y-2">
                      <TextFieldRoot>
                        <TextFieldLabel htmlFor="parentw-phone">Phone Number</TextFieldLabel>
                        <TextField id="parent2-phone" type="tel" name="parent2-phone" required value={data().screen0?.['parent2-phone']} placeholder="+1 (201) 555-0123"  on:keydown={(e) => {
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
                    </div>
                    <div className="space-y-2">
                      <TextFieldRoot>
                        <TextFieldLabel htmlFor="parent2-relationship">Relationship to Student</TextFieldLabel>
                        <TextField id="parent2-relationship" name="parent2-relationship" value={data().screen0?.['parent2-relationship']} placeholder="Mother, Father, Guardian, etc." required />
                      </TextFieldRoot>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button onClick={() => {
                  setParents(2);
                }} disabled={parents() === 2}>
                  Add Another Parent
                </Button>
                <Button variant="secondary" onClick={() => {
                  setParents(1);
                }} disabled={parents() === 1}>
                  Remove Parent
                </Button>
              </div>
              
            </div>
          </div>
        </TabsContent>
        <TabsContent value="signedup" class="space-y-4">
          <Login />
        </TabsContent>
      </Tabs>
    </>,
    () => <>
      <Tabs defaultValue="join" class="w-full" onChange={(e) => {
        if (joinRequest() === null) {
          setTeamType(e);
        } else {
          setTeamType('join');
          alert('Please cancel your team join request before switching to another option.');
        }

        if (e === 'join') {
          setShowNext(false);
        } else {
          setShowNext(true);
        }
      }} value={teamType()}>
        <TabsList>
          <TabsTrigger value="join">Join a Team</TabsTrigger>
          <TabsTrigger value="create">Create a Team</TabsTrigger>
          <TabsTrigger value="solo">Work Alone</TabsTrigger>
          <TabsTrigger value="search">Looking for Team</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="join" class="space-y-4">
          <h3 className="text-lg font-medium">Join a Team</h3>
          <div className="space-y-6">
            {
              joinRequest() === null ? (
                teams().length > 0 ? (<>
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
                  { teams().map(team => (
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
                        <Button onClick={() => {setJoinRequest(team); document.querySelector('form').requestSubmit();}} class="w-full h-full">Request</Button>
                      </CardFooter>
                    </Card>
                  ))}</>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500">No teams available</p>
                  </div>
                )
              ) : (
                setShowNext(true),
                <div className="text-center">
                  <p className="text-gray-500">You have already requested to join a team:</p>
                  <Card class="text-left w-auto md:col-span-1 p-3 mt-2">
                    <CardHeader class="p-3">
                      <CardTitle>{joinRequest().name}</CardTitle>
                      <CardDescription>{joinRequest().members.length} member{joinRequest().members.length == 1 ? '' : 's'}</CardDescription>
                    </CardHeader>
                    <CardContent class="flex flex-col p-3">
                      <span className="text-sm text-gray-500">Leader:</span>
                      {joinRequest().members.find(member => member.id === joinRequest().leaderId).name}
                    </CardContent>
                    <CardFooter class="p-3">
                      <Button onClick={() => {
                        setJoinRequest(null);
                        setShowNext(false);
                      }} class="w-full h-full">Cancel Request</Button>
                    </CardFooter>
                  </Card>
                </div>
              )
            }
          </div>
        </TabsContent>
        <TabsContent value="create" class="space-y-4">
          <h3 className="text-lg font-medium">Team Information</h3>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="team-name">Team Name</TextFieldLabel>
              <TextField
                id="team-name"
                placeholder="Enter your team name"
                name="team-name"
                required
                value={data().screen1?.teamInformation?.['team-name']}
              />
            </TextFieldRoot>
          </div>

          <div className="space-y-2">
            <Select 
              options={[{value: "2", label: "2"}, {value: "3", label: "3"}, {value: "4", label: "4"}]}
              label="Team Size"
              optionValue="value"
              value={memberCount()}
              onChange={(checked) => {
                if (checked) {
                  setMemberCount(checked);
                } else {
                  setMemberCount(null);
                }
              }}
              optionTextValue="label"
              placeholder="Select your team size"
              itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
            >
              <Label>Team Size</Label>
              <SelectTrigger id="size">
                <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <div className="space-y-2">
            <Select 
              options={[{value: "beginner", label: "Beginner (0-1 years)"}, {value: "intermediate", label: "Intermediate (1-3 years)"}, {value: "advanced", label: "Advanced (3+ years)"}]}
              label="Experience Level"
              optionValue="value"
              value={experience()}
              onChange={(checked) => {
                if (checked) {
                  setExperience(checked);
                } else {
                  setExperience(null);
                }
              }}
              optionTextValue="label"
              placeholder="Select your experience level"
              itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
            >
              <Label>Experience Level</Label>
              <SelectTrigger id="experience">
                <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <CategoryPicker
            categories={availableCategories()}
            selected={categories()}
            onChange={setCategories}
          />

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="project-idea">Project Idea (optional)</TextFieldLabel>
              <TextArea
                id="project-idea"
                placeholder="Briefly describe any project ideas you have for the hackathon"
                name="project-idea"
                value={data().screen1?.teamInformation?.['project-idea']}
              />
            </TextFieldRoot>
          </div>
        </TabsContent>
        <TabsContent value="solo" class="space-y-4">
          <h3 className="text-lg font-medium">Work Alone</h3>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="team-name">Team Name</TextFieldLabel>
              <TextField
                id="team-name"
                placeholder="Enter your team name"
                name="team-name"
                required
                value={data().screen1?.teamInformation?.['team-name']}
              />
            </TextFieldRoot>
          </div>

          <div className="space-y-2">
            <Select 
              options={[{value: "beginner", label: "Beginner (0-1 years)"}, {value: "intermediate", label: "Intermediate (1-3 years)"}, {value: "advanced", label: "Advanced (3+ years)"}]}
              label="Experience Level"
              optionValue="value"
              value={experience()}
              onChange={(checked) => {
                if (checked) {
                  setExperience(checked);
                } else {
                  setExperience(null);
                }
              }}
              optionTextValue="label"
              placeholder="Select your experience level"
              itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
            >
              <Label>Experience Level</Label>
              <SelectTrigger id="experience">
                <SelectValue>{state => state.selectedOption()?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <CategoryPicker
            categories={availableCategories()}
            selected={categories()}
            onChange={setCategories}
          />

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="project-idea">Project Idea (optional)</TextFieldLabel>
              <TextArea
                id="project-idea"
                placeholder="Briefly describe any project ideas you have for the hackathon"
                name="project-idea"
                value={data().screen1?.teamInformation?.['project-idea']}
              />
            </TextFieldRoot>
          </div>
        </TabsContent>
        <TabsContent value="search" class="space-y-4">
          <h3 className="text-lg font-medium">Looking for a team</h3>
          <p className="text-sm text-muted-foreground">
            By selecting this option, you will be able to join or create a team after registration.
          </p>
        </TabsContent>
      </Tabs>
    </>,
    () => <>
      <div className="flex items-start space-x-2">
        <Checkbox id="cb1" class="flex items-start space-x-2 mt-1" name="checkbox1" checked={checkbox1()} onChange={(e) => e ? setCheckbox1('on') : setCheckbox1(null)} required>
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2 mb-1">
              <CheckboxControl />
              <CheckboxLabel className="font-medium">
                Something
              </CheckboxLabel>
            </div>
            <CheckboxDescription class="text-sm text-muted-foreground text-input">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo, consequuntur? Dignissimos quisquam voluptate praesentium at iusto hic aliquam deserunt rem exercitationem esse asperiores magni tenetur ipsum, debitis aspernatur, culpa corrupti reiciendis dicta dolores nesciunt ut porro autem! Vitae, pariatur provident facilis numquam molestiae non nulla dolor. Cum natus facilis voluptates.
            </CheckboxDescription>
          </div>
        </Checkbox>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="cb2" class="flex items-start space-x-2 mt-1" name="checkbox2" checked={checkbox2()} onChange={(e) => e ? setCheckbox2('on') : setCheckbox2(null)} required>
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2 mb-1">
              <CheckboxControl />
              <CheckboxLabel className="font-medium">
                Something else
              </CheckboxLabel>
            </div>
            <CheckboxDescription class="text-sm text-muted-foreground text-input">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores quasi quae aliquid assumenda dolor non accusantium reprehenderit facere quam beatae, odio ipsum quaerat, dicta odit labore harum repudiandae ipsa. Voluptatum soluta magni libero quo vitae, cumque repudiandae quaerat voluptatem nemo quibusdam, sequi quas quam modi necessitatibus illo consequatur quis reprehenderit.
            </CheckboxDescription>
          </div>
        </Checkbox>
      </div>
    </>,
    () => <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Registration</h3>
      <Card>
        <CardHeader class="border-b mb-0">
          <CardTitle>Registration Summary</CardTitle>
          <CardDescription class="text-slate-900">
            Please review your registration information before submitting.
          </CardDescription>
        </CardHeader>
        <CardContent class="pt-6 space-y-2">
          <p><strong>First Name:</strong> {data().screen0?.['first-name']}</p>
          <p><strong>Last Name:</strong> {data().screen0?.['last-name']}</p>
          <p><strong>Email:</strong> {data().screen0?.email}</p>
          <p><strong>Phone:</strong> {data().screen0?.phone}</p>
          <p><strong>School:</strong> {school()?.label}</p>
          <p><strong>Major:</strong> {major()?.label}</p>
          <p><strong>Grade:</strong> {grade()?.label}</p>
          <p><strong>T-Shirt Size:</strong> {shirt()?.label}</p>
        </CardContent>
        <Separator />
        <CardContent class="pt-6 space-y-2">
          <p><strong>Team Type:</strong> {teamType() === 'create' ? 'Create a Team' : teamType() === 'join' ? 'Join a Team' : 'Work Alone'}</p>
          {teamType() === 'create' && (
            <>
              <p><strong>Team Name:</strong> {data().screen1?.teamInformation?.['team-name']}</p>
              <p><strong>Project Idea:</strong> {data().screen1?.teamInformation?.['project-idea']}</p>
              <p><strong>Experience Level:</strong> {experience()?.label}</p>
              <p><strong>Team Size:</strong> {memberCount()?.label}</p>
              <p><strong>Categories:</strong> {categories()?.map(cat => cat.label).join(', ')}</p>
            </>
          )}
          {teamType() === 'join' && (
            <>
              <p><strong>Requesting Team:</strong> {joinRequest().name}</p>
              <p><strong>Team Leader:</strong> {joinRequest().members.find(member => member.id === joinRequest().leaderId).name}</p>
            </>
          )}
          {teamType() === 'solo' && (
            <>
              <p><strong>Work Alone:</strong> {data().screen1?.teamInformation?.['team-name']}</p>
            </>
          )}
        </CardContent>
        <Separator />
        <CardContent class="pt-6 space-y-2">
          <p><strong>Checkbox 1:</strong> {checkbox1() ? 'Accepted' : 'Not Accepted'}</p>
          <p><strong>Checkbox 2:</strong> {checkbox2() ? 'Accepted' : 'Not Accepted'}</p>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2">
        <Checkbox id="cb3" class="flex items-start space-x-2 mt-1" name="checkbox3" checked={checkbox3()} onChange={(e) => e ? setCheckbox3('on') : setCheckbox3(null)} required>
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-2 mb-1">
              <CheckboxControl />
              <CheckboxLabel className="font-medium">
                I have reviewed my registration information and confirm that it is accurate.
              </CheckboxLabel>
            </div>
            <CheckboxDescription class="text-sm text-muted-foreground text-input">
              By checking this box, I acknowledge that I have read and agree to the terms and conditions of the hackathon.
            </CheckboxDescription>
          </div>
        </Checkbox>
      </div>
    </div>,
    () => <>
      <Register email={email()} />
    </>
  ]

  return (
    <>
      <Ui>
        <main className="container mx-auto py-8 px-4">
          <Card class="max-w-3xl mx-auto overflow-hidden">
            <CardHeader class="bg-[#1a2533] text-white">
              <CardTitle class="flex flex-row items-center py-2 gap-2">
                Sign Up for the Hackathon
                <Button variant="outline" class="ml-auto" onClick={() => {
                  location.href = 'https://bthackathon.com';
                }}>Home</Button>
              </CardTitle>
            </CardHeader>
            <CardContent class="pt-2 space-y-2">
              <div className="flex items-center justify-between flex-col gap-2 pb-2">
                <ToggleGroup value={section()} class="w-full flex justify-between">
                  <ToggleGroupItem value="0" class="flex-1" aria-label="Toggle bold" checked={section() <= 0} onClick={() => switchToSection(0)} disabled={!unlocked()[0]}>
                    Personal
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1" class="flex-1" aria-label="Toggle italic" checked={section() <= 1} onClick={() => switchToSection(1)} disabled={!unlocked()[1]}>
                    Team
                  </ToggleGroupItem>
                  <ToggleGroupItem value="2" class="flex-1" aria-label="Toggle strikethrough" checked={section() <= 2} onClick={() => switchToSection(2)} disabled={!unlocked()[2]}>
                    Legal
                  </ToggleGroupItem>
                  <ToggleGroupItem value="3" class="flex-1" aria-label="Toggle underline" checked={section() <= 3} onClick={() => switchToSection(3)} disabled={!unlocked()[3]}>
                    Review
                  </ToggleGroupItem>   
                  <ToggleGroupItem value="4" class="flex-1" aria-label="Toggle underline" checked={section() <= 4} onClick={() => switchToSection(4)} disabled={!unlocked()[4]}>
                    Account
                  </ToggleGroupItem>
                </ToggleGroup>
                <Progress value={[10, 30, 50, 70, 90][section()]} class="w-full" />
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (section() < sections.length - 1) {
                  // Validate the form
                  const form = e.target;
                  if (!school()) {
                    alert("Please select a school.");
                    return;
                  }
                  if (selfRegBlocked()) {
                    alert("Self-registration is not available for " + selfRegBlocked().schoolLabel + ". Please contact your school administrator.");
                    return;
                  }
                  if (!major()) {
                    alert("Please select a major.");
                    return;
                  }
                  if (!grade()) {
                    alert("Please select a grade.");
                    return;
                  }
                  switch(section()) {
                    case 0:
                      const formData = Object.fromEntries(new FormData(form));
                      formData.school = school();
                      formData.major = major();
                      formData.shirt = shirt();
                      formData.grade = grade();
                      formData.parents = parents();
                      if (!localStorage.getItem('screen0')) {
                        localStorage.setItem('screen0', JSON.stringify({}));
                      }
                      localStorage.setItem('screen0', JSON.stringify(
                        {
                          ...JSON.parse(localStorage.getItem('screen0')),
                          ...formData
                        }
                      ));
                      _data.screen0 = JSON.parse(localStorage.getItem('screen0'));
                      setData(_data);
                      break;
                    case 1:
                      const formData2 = Object.fromEntries(new FormData(form));
                      formData2.teamType = teamType();
                      formData2.teamInformation = {};
                      if (formData2.teamType === 'create') {
                        formData2.teamInformation['team-name'] = formData2['team-name'];
                        formData2.teamInformation['project-idea'] = formData2['project-idea'];
                        formData2.teamInformation['experience'] = experience();
                        formData2.teamInformation['memberCount'] = memberCount();
                        formData2.teamInformation['categories'] = categories();
                        formData2.teamInformation.solo = false;
                        formData2.teamInformation.looking = false;
                      } else if (formData2.teamType === 'solo') {
                        formData2.teamInformation['team-name'] = formData2['team-name'];
                        formData2.teamInformation['project-idea'] = formData2['project-idea'];
                        formData2.teamInformation['experience'] = experience();
                        formData2.teamInformation['categories'] = categories();
                        formData2.teamInformation['memberCount'] = 1;
                        formData2.teamInformation.solo = true;
                        formData2.teamInformation.looking = false;
                      } else if (formData2.teamType === 'search') {
                        formData2.teamInformation.looking = true;
                      } else {
                        if (!joinRequest()) {
                          alert("Please select a team to join.");
                          return;
                        }
                        formData2.teamInformation.solo = false;
                        formData2.teamInformation.looking = false;
                        formData2.teamInformation['id'] = joinRequest()?.id;
                        delete formData2['team-name'];
                      }

                      console.log(formData2);

                      if (!localStorage.getItem('screen1')) {
                        localStorage.setItem('screen1', JSON.stringify({}));
                      }
                      localStorage.setItem('screen1', JSON.stringify(
                        {
                          ...JSON.parse(localStorage.getItem('screen1')),
                          ...formData2
                        }
                      ));
                      _data.screen1 = JSON.parse(localStorage.getItem('screen1'));
                      setData(_data);
                      break;
                    case 2:
                      const formData3 = Object.fromEntries(new FormData(form));
                      if (!localStorage.getItem('screen2')) {
                        localStorage.setItem('screen2', JSON.stringify({}));
                      }
                      localStorage.setItem('screen2', JSON.stringify(
                        {
                          ...JSON.parse(localStorage.getItem('screen2')),
                          ...formData3
                        }
                      ));
                      _data.screen2 = JSON.parse(localStorage.getItem('screen2'));
                      setData(_data);
                      break;
                  }
                  setUnlocked(unlocked().map((_, i) => i <= section() + 1));

                  if (section() === 0 && teamType() === 'join') {
                    setShowNext(false);
                  } else if (location.hash !== '#5') {
                    setShowNext(true);
                  }

                  setSection(section() + 1);
                } else {
                  const form = e.target;
                  const accountData = Object.fromEntries(new FormData(form));

                  if (accountData['password'] !== accountData['confirm-password']) {
                    alert("Passwords do not match.");
                    return;
                  }

                  accountData['name'] = `${data().screen0?.['first-name']} ${data().screen0?.['last-name']}`;
                  accountData['school'] = school()?.label;
                  accountData['email'] = data().screen0?.email;

                  delete accountData['confirm-password'];

                  const registrationData = {
                    accountData,
                    screen0: JSON.parse(localStorage.getItem('screen0')),
                    screen1: JSON.parse(localStorage.getItem('screen1')),
                    screen2: JSON.parse(localStorage.getItem('screen2'))
                  };

                  if (!checkbox3()) {
                    alert("Please accept the {checkbox3}.");
                    return;
                  }

                  if (registrationData.screen2) {
                    if (!registrationData.screen2.checkbox1) {
                      alert("Please accept the {checkbox1}.");
                      return;
                    }
                    if (!registrationData.screen2.checkbox2) {
                      alert("Please accept the {checkbox2}.");
                      return;
                    }
                  }

                  fetch('/api/register', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registrationData)
                  }).then(res => res.json()).then(data => {
                    if (!data.error) {
                      alert("Registration successful. Please check your email for confirmation.");
                      localStorage.removeItem('screen0');
                      localStorage.removeItem('screen1');
                      localStorage.removeItem('screen2');
                      location.href = '/signup/dashboard';
                    } else {
                      alert("Registration failed. Please try again.");
                    }
                  });
                }
              }}>
                <div className="space-y-6">
                  <div className="space-y-4">
                    {sections[section()]()}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter class="flex flex-col sm:flex-row gap-4">
              {
                section() > 0 && (
                  (showNext() ? <Button variant="outline" class="w-full sm:w-auto" onClick={() => switchToSection(section() - 1)}>
                    Back
                  </Button> : <></>)
                )
              }
              {
                section() < sections.length - 1 ? 
                  (showNext() ? <Button type="button" class="w-full sm:w-auto bg-[#f5b700] hover:bg-[#e5a700] text-black" onClick={() => {
                    switchToSection(section() + 1);
                  }}>
                    Next
                  </Button> : <></>)
                :
                  <Button type="button" class="w-full sm:w-auto bg-[#f5b700] hover:bg-[#e5a700] text-black" onClick={() => {
                    document.querySelector('form')?.requestSubmit();
                  }}>
                    Submit
                  </Button>
              }
            </CardFooter>
          </Card>

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

export default App;
