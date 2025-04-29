import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { TextField, TextFieldLabel, TextFieldRoot } from "./ui/textfield";

import bcrypt from "bcryptjs";

export default function Login() {
    const submit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message === "Login successful") {
                    location.href = "/signup/dashboard";
                } else {
                    alert("Invalid credentials");
                }
            })
            .catch((err) => {
                console.error(err);
                alert("An error occurred. Please try again.");
            });
    };
    return (
        <Card class="border-none">
            <form onSubmit={submit}>
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account.
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-2">
                    <TextFieldRoot class="space-y-1">
                        <TextFieldLabel>Email</TextFieldLabel>
                        <TextField name="email" required />
                    </TextFieldRoot>
                    <TextFieldRoot class="space-y-1">
                        <TextFieldLabel>Password</TextFieldLabel>
                        <TextField name="password" type="password" required />
                    </TextFieldRoot>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Sign in</Button>
                </CardFooter>
            </form>
        </Card>
    );
}