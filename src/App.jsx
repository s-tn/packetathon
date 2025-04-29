import Ui from "./ui";
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Checkbox, CheckboxControl, CheckboxDescription, CheckboxLabel } from "./components/ui/checkbox"
import Login from './components/login';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
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
import { createEffect, createSignal } from "solid-js";
import Register from "./components/register";

const App = () => {
  let data = {
    screen0: null,
    screen1: null
  };
  if (localStorage.getItem('screen0')) {
    data.screen0 = JSON.parse(localStorage.getItem('screen0'));
  }
  if (localStorage.getItem('screen1')) {
    data.screen1 = JSON.parse(localStorage.getItem('screen1'));
  }
  if (localStorage.getItem('screen2')) {
    data.screen2 = JSON.parse(localStorage.getItem('screen2'));
  }
  console.log('saved', data);
  let [ section, _setSection ] = createSignal(window.location.hash ? parseInt(window.location.hash.replace('#', '')) : 0);

  const setSection = (value) => {
    _setSection(value);
    window.history.pushState(null, null, `#${value}`);
  };

  const majors = {
    bt: [
      { value: "compsci", label: "Computer Science" },
      { value: "digital", label: "Digital Media" },
      { value: "business", label: "Business" },
      { value: "aero", label: "Aerospace Engineering" },
      { value: "auto", label: "Automotive Engineering" },
      { value: "law", label: "Law" },
      { value: "culinary", label: "Culinary" },
      { value: "comart", label: "Commercial Art" },
      { value: "other", label: "Other" }
    ],
    at: [
      { value: "cyber", label: "Cybersecurity" },
      { value: "other", label: "Other" }
    ]
  };
  const [ school, setSchool ] = createSignal(data.screen0?.school);
  const [ major, setMajor ] = createSignal(data.screen0?.major);
  const [ grade, setGrade ] = createSignal(data.screen0?.grade);
  const [ shirt, setShirt ] = createSignal(data.screen0?.shirt);
  const [ checkbox1, setCheckbox1 ] = createSignal(data.screen2?.checkbox1);
  const [ checkbox2, setCheckbox2 ] = createSignal(data.screen2?.checkbox2);
  const [ teamType, setTeamType ] = createSignal(data.screen1?.teamType);
  const [ memberCount, setMemberCount ] = createSignal(data.screen1?.teamInformation?.memberCount);
  const [ experience, setExperience ] = createSignal(data.screen1?.teamInformation?.experience);
  const [ categories, setCategories ] = createSignal(data.screen1?.teamInformation?.categories);
  const [ showNext, setShowNext ] = createSignal(true);

  createEffect(() => {
    fetch('/api/check-login').then(res => res.json()).then(data => {
      if (data.loggedIn) {
        location.href = '/signup/dashboard'
      }
    }).catch(err => {
      console.error(err);
    });
  });

  const sections = [
    <>
      <Tabs defaultValue="signup" class="w-full" onChange={(e) => {
        if (e === 'signedup') {
          setShowNext(false);
        } else {
          setShowNext(true);
        }
      }}>
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
                <TextField id="first-name" name="first-name" value={data.screen0?.['last-name']} placeholder="John" required />
              </TextFieldRoot>
            </div>
            <div className="space-y-2">
              <TextFieldRoot>
                <TextFieldLabel htmlFor="last-name">Last Name</TextFieldLabel>
                <TextField id="last-name" name="last-name" value={data.screen0?.['last-name']} placeholder="Doe" required />
              </TextFieldRoot>
            </div>
          </div>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="email">Email Address</TextFieldLabel>
              <TextField id="email" type="email" name="email" value={data.screen0?.email} placeholder="john.doe@example.com" required />
            </TextFieldRoot>
          </div>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Phone Number</TextFieldLabel>
              <TextField id="phone" type="tel" name="phone" value={data.screen0?.phone} placeholder="+1 (201) 555-0123" on:keydown={(e) => {
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
                options={[{value: "bt", label: "Bergen Tech"}, {value: "at", label: "Applied Tech"}]}
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
                options={majors[school()?.value] || []}
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
          </div>
        </TabsContent>
        <TabsContent value="signedup" class="space-y-4">
          <Login />
        </TabsContent>
      </Tabs>
    </>,
    <>
      <Tabs defaultValue="join" class="w-full" onChange={(e) => {
        setTeamType(e);
      }} value={teamType()}>
        <TabsList>
          <TabsTrigger value="join">Join a Team</TabsTrigger>
          <TabsTrigger value="create">Create a Team</TabsTrigger>
          <TabsTrigger value="solo">Work Alone</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="join">
          <h3 className="text-lg font-medium">Join a Team</h3>
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
                value={data.screen1?.teamInformation?.['team-name']}
              />
            </TextFieldRoot>
          </div>

          <div className="space-y-2">
            <Select 
              options={[{value: "2", label: "2"}, {value: "3", label: "3"}, {value: "4", label: "4"}, {value: "-1", label: "TBD"}]}
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

          <div className="space-y-2">
            <Select 
              options={(() => {
                let opts = [
                  { value: 'ai', label: 'Best Artificial Intelligence' },
                  { value: 'mobile', label: 'Best Mobile App' },
                  { value: 'hardware', label: 'Best Physical System' },
                  { value: 'game', label: 'Best Game' },
                ];

                if (grade().value === '9') {
                  opts.push({ value: 'freshman', label: 'Best Freshman Project' });
                }

                if (experience().value === 'beginner') {
                  opts.push({ value: 'beginner', label: 'Best New Coder' });
                }

                return opts;
              })()}
              label="Categories"
              multiple={true}
              optionValue="value"
              value={categories()}
              onChange={(checked) => {
                 if (checked) {
                  setCategories(checked);
                 } else {
                  setCategories(null);
                 }
              }}
              optionTextValue="label"
              placeholder="Select your categories"
              itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
            >
              <Label>Categories</Label>
              <SelectTrigger id="size">
                <SelectValue>{state => state.selectedOptions().map(option => option.label).join(', ')}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          {/* <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel>Skills & Technologies</TextFieldLabel>
              <TextArea
                id="skills"
                placeholder="List programming languages, frameworks, or other technical skills you're comfortable with"
              />
            </TextFieldRoot>
          </div> */}

          <div className="space-y-2">
            {/*<Select>
              <Label>Do you have a team?</Label>
              <SelectTrigger id="team">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, I have a team</SelectItem>
                <SelectItem value="no">No, I need a team</SelectItem>
                <SelectItem value="forming">I'm forming a team</SelectItem>
              </SelectContent>
            </Select>*/}
          </div>

          <div className="space-y-2">
            <TextFieldRoot>
              <TextFieldLabel htmlFor="project-idea">Project Idea (optional)</TextFieldLabel>
              <TextArea
                id="project-idea"
                placeholder="Briefly describe any project ideas you have for the hackathon"
                name="project-idea"
                value={data.screen1?.teamInformation?.['project-idea']}
              />
            </TextFieldRoot>
          </div>

          {/* <div className="flex items-center space-x-2">
            <Checkbox id="tshirt" class="flex items-center space-x-2">
              <CheckboxControl />
              <CheckboxLabel htmlFor="tshirt">I would like a hackathon T-shirt</CheckboxLabel>
            </Checkbox>
          </div> */}
        </TabsContent>
        <TabsContent value="solo">
          <h3 className="text-lg font-medium">Work Alone</h3>
        </TabsContent>
      </Tabs>
    </>,
    <>
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
    <>
      <Register />
    </>
  ]

  return (
    <>
      <Ui>
        <main className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-center mb-8">2026 Bergen Tech Hackathon Registration</h1>

          <Card class="max-w-3xl mx-auto overflow-hidden">
            <CardHeader class="bg-[#1a2533] text-white">
              <CardTitle>Sign Up for the Hackathon</CardTitle>
              <CardDescription class="text-slate-300">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Non iure saepe molestias ipsam nam dolor veniam officia. Incidunt, magni earum.
              </CardDescription>
            </CardHeader>
            <CardContent class="pt-6">
            <ToggleGroup multiple>
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm6 7h1a3.5 3.5 0 0 1 0 7H7v-7"
                  />
                </svg>
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5h6M7 19h6m1-14l-4 14"
                  />
                </svg>
              </ToggleGroupItem>
              <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 5v5a5 5 0 0 0 10 0V5M5 19h14"
                  />
                </svg>
              </ToggleGroupItem>
            </ToggleGroup>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (section() < sections.length - 1) {
                  // Validate the form
                  const form = e.target;
                  if (!school()) {
                    alert("Please select a school.");
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
                      const data = Object.fromEntries(new FormData(form));
                      data.school = school();
                      data.major = major();
                      data.shirt = shirt();
                      data.grade = grade();
                      if (!localStorage.getItem('screen0')) {
                        localStorage.setItem('screen0', JSON.stringify({}));
                      }
                      localStorage.setItem('screen0', JSON.stringify(
                        {
                          ...JSON.parse(localStorage.getItem('screen0')),
                          ...data
                        }
                      ));
                      break;
                    case 1:
                      const data2 = Object.fromEntries(new FormData(form));
                      data2.teamType = teamType();
                      data2.teamInformation = {};
                      if (data2.teamType === 'create') {
                        data2.teamInformation['team-name'] = data2['team-name'];
                        data2.teamInformation['project-idea'] = data2['project-idea'];
                        data2.teamInformation['experience'] = experience();
                        data2.teamInformation['memberCount'] = memberCount();
                        data2.teamInformation['categories'] = categories();
                        data2.teamInformation.solo = false;
                      } else if (data2.teamType === 'solo') {
                        data2.teamInformation['team-name'] = data2['team-name'];
                        data2.teamInformation['project-idea'] = data2['project-idea'];
                        data2.teamInformation['experience'] = experience();
                        data2.teamInformation['categories'] = categories();
                        data2.teamInformation['memberCount'] = 1;
                        data2.teamInformation.solo = true;
                      }

                      if (!localStorage.getItem('screen1')) {
                        localStorage.setItem('screen1', JSON.stringify({}));
                      }
                      localStorage.setItem('screen1', JSON.stringify(
                        {
                          ...JSON.parse(localStorage.getItem('screen1')),
                          ...data2
                        }
                      ));
                      break;
                    case 2:
                      const data3 = Object.fromEntries(new FormData(form));
                      if (!localStorage.getItem('screen2')) {
                        localStorage.setItem('screen2', JSON.stringify({}));
                      }
                      localStorage.setItem('screen2', JSON.stringify(
                        {
                          ...JSON.parse(localStorage.getItem('screen2')),
                          ...data3
                        }
                      ));
                      break;
                  }
                  setSection(section() + 1);
                } else {
                  const form = e.target;
                  const accountData = Object.fromEntries(new FormData(form));

                  if (accountData['password'] !== accountData['confirm-password']) {
                    alert("Passwords do not match.");
                    return;
                  }

                  delete accountData['confirm-password'];

                  const registrationData = {
                    accountData,
                    screen0: JSON.parse(localStorage.getItem('screen0')),
                    screen1: JSON.parse(localStorage.getItem('screen1')),
                    screen2: JSON.parse(localStorage.getItem('screen2'))
                  };

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
                    if (data.success) {
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
                    {sections[section()]}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter class="flex flex-col sm:flex-row gap-4">
              {
                section() > 0 && (
                  (showNext() ? <Button variant="outline" class="w-full sm:w-auto" onClick={() => setSection(section() - 1)}>
                    Back
                  </Button> : <></>)
                )
              }
              {
                section() < sections.length - 1 ? 
                  (showNext() ? <Button type="button" class="w-full sm:w-auto bg-[#f5b700] hover:bg-[#e5a700] text-black" onClick={() => {
                    document.querySelector('form').requestSubmit();
                  }}>
                    Next
                  </Button> : <></>)
                :
                  <Button type="button" class="w-full sm:w-auto bg-[#f5b700] hover:bg-[#e5a700] text-black" onClick={() => {
                    document.querySelector('form').requestSubmit();
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
        </main>
      </Ui>
    </>
  );
};

export default App;
