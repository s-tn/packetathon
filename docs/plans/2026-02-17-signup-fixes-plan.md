# Signup Page Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix form navigation bugs, phone input issues, remove placeholder text, redirect home button, and fix password reset 404.

**Architecture:** All frontend changes are in the SolidJS registration form (`src/App.jsx`). One backend change in `server/routes/auth.ts`. No new files needed.

**Tech Stack:** SolidJS, Kobalte UI, Express/Vite middleware, Prisma

---

### Task 1: Remove Header Lorem Text

**Files:**
- Modify: `src/App.jsx:1235-1237`

**Step 1: Remove the CardDescription element**

In `src/App.jsx`, find and remove these 3 lines (inside the CardHeader):

```jsx
              <CardDescription class="text-slate-300">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Non iure saepe molestias ipsam nam dolor veniam officia. Incidunt, magni earum.
              </CardDescription>
```

**Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: remove lorem ipsum from signup page header"
```

---

### Task 2: Home Button Redirect

**Files:**
- Modify: `src/App.jsx:1232`

**Step 1: Change the home button URL**

In `src/App.jsx`, in the CardHeader Button onClick handler, change:

```jsx
                  location.href = '/';
```

to:

```jsx
                  location.href = 'https://bthackathon.com';
```

**Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: redirect home button to bthackathon.com"
```

---

### Task 3: Remove Legal Section

This is the largest change. It removes the Legal step (sections[2]) and adjusts all downstream references.

**Files:**
- Modify: `src/App.jsx`

**Step 1: Remove the Legal section from the sections array**

Find the entire Legal section (the third element of the `sections` array). It starts with `() => <>` containing `cb1` and `cb2` checkboxes, and ends right before `() => <div className="space-y-4">` (the Review section). Remove it along with the trailing comma:

Remove from:
```jsx
    () => <>
      <div className="flex items-start space-x-2">
        <Checkbox id="cb1" class="flex items-start space-x-2 mt-1" name="checkbox1" checked={checkbox1()} onChange={(e) => e ? setCheckbox1('on') : setCheckbox1(null)} required>
```

Through the end of that section:
```jsx
      </div>
    </>,
```

This is the entire block from the original lines 1119-1151.

**Step 2: Remove checkbox1/checkbox2 from Review section**

In the Review section (now sections[2]), find and remove the Separator and the checkbox display:

```jsx
        <Separator />
        <CardContent class="pt-6 space-y-2">
          <p><strong>Checkbox 1:</strong> {checkbox1() ? 'Accepted' : 'Not Accepted'}</p>
          <p><strong>Checkbox 2:</strong> {checkbox2() ? 'Accepted' : 'Not Accepted'}</p>
        </CardContent>
```

**Step 3: Remove checkbox1/checkbox2 validation from form submit**

In the form's onSubmit handler, find and remove these lines that validate the legal checkboxes:

```jsx
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
```

**Step 4: Update the ToggleGroup tabs**

Remove the "Legal" tab and renumber. Change from 5 tabs to 4:

Replace the entire ToggleGroup block:
```jsx
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
```

With:
```jsx
                <ToggleGroup value={section()} class="w-full flex justify-between">
                  <ToggleGroupItem value="0" class="flex-1" aria-label="Personal" checked={section() <= 0} onClick={() => switchToSection(0)} disabled={!unlocked()[0]}>
                    Personal
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1" class="flex-1" aria-label="Team" checked={section() <= 1} onClick={() => switchToSection(1)} disabled={!unlocked()[1]}>
                    Team
                  </ToggleGroupItem>
                  <ToggleGroupItem value="2" class="flex-1" aria-label="Review" checked={section() <= 2} onClick={() => switchToSection(2)} disabled={!unlocked()[2]}>
                    Review
                  </ToggleGroupItem>
                  <ToggleGroupItem value="3" class="flex-1" aria-label="Account" checked={section() <= 3} onClick={() => switchToSection(3)} disabled={!unlocked()[3]}>
                    Account
                  </ToggleGroupItem>
                </ToggleGroup>
```

**Step 5: Update progress bar values**

Change:
```jsx
                <Progress value={[10, 30, 50, 70, 90][section()]} class="w-full" />
```

To:
```jsx
                <Progress value={[10, 35, 65, 90][section()]} class="w-full" />
```

**Step 6: Update unlocked array initializer**

Change the initial unlocked array from 5 elements to 4. Find:
```jsx
  const [ unlocked, setUnlocked ] = createSignal([false, false, false, false, false].map((_, i) => i <= section()));
```

Replace with:
```jsx
  const [ unlocked, setUnlocked ] = createSignal([false, false, false, false].map((_, i) => i <= section()));
```

**Step 7: Update the form onSubmit case indices**

In the form `onSubmit`, the `switch(section())` has cases 0, 1, 2. After removing Legal, the old case 2 (which saved screen2/checkbox data to localStorage) is no longer needed. The Review section (now index 2) doesn't need its own case since there's nothing to save. Remove the old `case 2:` block:

```jsx
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
```

Also remove references to `screen2` in the registration submission and localStorage cleanup. In the `registrationData` object, remove:
```jsx
                    screen2: JSON.parse(localStorage.getItem('screen2'))
```

And in the success handler, remove:
```jsx
                      localStorage.removeItem('screen2');
```

**Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat: remove Legal section from registration form"
```

---

### Task 4: Fix Form Next Button

**Files:**
- Modify: `src/App.jsx`

**Step 1: Change the Next button to submit the form directly**

Find the Next button (currently using `switchToSection`):

```jsx
                  (showNext() ? <Button type="button" class="w-full sm:w-auto bg-[#f5b700] hover:bg-[#e5a700] text-black" onClick={() => {
                    switchToSection(section() + 1);
                  }}>
                    Next
                  </Button> : <></>)
```

Replace with:

```jsx
                  (showNext() ? <Button type="button" class="w-full sm:w-auto bg-[#f5b700] hover:bg-[#e5a700] text-black" onClick={() => {
                    document.querySelector('form')?.requestSubmit();
                  }}>
                    Next
                  </Button> : <></>)
```

This makes the Next button trigger the form's onSubmit handler directly, which shows validation alerts and advances the section on success. The `switchToSection` function remains for the tab header clicks only (where multi-step jump validation is needed).

**Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: make Next button show validation errors instead of silently failing"
```

---

### Task 5: Fix Phone Number Tab Key

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add Tab to the allow-list in all 3 phone keydown handlers**

There are 3 phone input fields with identical keydown handlers. In each one, find:

```jsx
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  return;
                }
                e.preventDefault();
```

Replace with:

```jsx
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Tab' || e.key === 'Enter') {
                  return;
                }
                e.preventDefault();
```

Do this for ALL 3 phone fields:
1. Main phone (id="phone")
2. Parent 1 phone (id="parent1-phone")
3. Parent 2 phone (id="parent2-phone")

Note: We also allow Enter so form submission via Enter key works.

**Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: allow Tab and Enter keys in phone number fields"
```

---

### Task 6: Fix Phone Number Autofill Formatting

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add an `on:input` handler to each phone field**

For each of the 3 phone fields, add an `on:input` event handler alongside the existing `on:keydown`. The `input` event fires after autofill and paste. Add this attribute right after the `on:keydown={...}` closing:

```jsx
on:input={(e) => {
  if (e.target._value !== undefined && e.target._value !== '') return;
  const raw = e.target.value.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
  if (raw.length === 0) return;
  e.target._value = raw;
  e.target.value = raw.replace(/^([0-9]{1,3})([0-9]{1,3})?([0-9]{1,4})?$/, (match, p1, p2, p3) => {
    let final = '';
    if (p1) final += `+1 (${p1})`;
    if (p2) final += ` ${p2}`;
    if (p3) final += `-${p3}`;
    return final;
  });
}}
```

This handler:
- Only activates when `_value` isn't already set (i.e., the keydown handler didn't process the input)
- Strips non-digit characters and the leading country code "1"
- Caps at 10 digits
- Applies the same formatting as the keydown handler

Do this for ALL 3 phone fields.

**Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "fix: format phone numbers on autofill and paste"
```

---

### Task 7: Password Reset Always Return 200

**Files:**
- Modify: `server/routes/auth.ts:261-264`

**Step 1: Change the user-not-found response**

In the `/api/forgot-password` handler, find:

```typescript
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }
```

Replace with:

```typescript
        if (!user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({}));
          return;
        }
```

This returns 200 with an empty success response, same as when a valid user is found. The client shows "Password reset link sent to your email" regardless.

**Step 2: Commit**

```bash
git add server/routes/auth.ts
git commit -m "fix: return 200 for forgot-password regardless of email existence"
```

---

### Task 8: Verify All Changes

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Manual verification checklist**

- [ ] Header: no lorem text below "Sign Up for the Hackathon"
- [ ] Home button: redirects to https://bthackathon.com
- [ ] Form tabs: Personal, Team, Review, Account (no Legal)
- [ ] Progress bar: 4 steps (10%, 35%, 65%, 90%)
- [ ] Personal -> Team: fill all fields, click Next, shows validation errors if missing fields, advances if valid
- [ ] Phone field: can Tab out of the field
- [ ] Phone field: autofill or paste a phone number, it formats correctly
- [ ] Parent phone fields: same Tab and autofill behavior
- [ ] Password reset: enter non-existent email, still shows "Password reset link sent"
- [ ] Full registration flow: can complete all 4 steps and submit

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup after signup page fixes"
```
