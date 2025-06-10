import { createSignal } from "solid-js";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { TextField, TextFieldLabel, TextFieldRoot } from "./ui/textfield";

import bcrypt from "bcryptjs";

export default function Login() {
    const [ forgotPassword, setForgotPassword ] = createSignal(false);
    const [ email, setEmail ] = createSignal("");
    const [ password, setPassword ] = createSignal("");

    const submit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (forgotPassword()) {
            fetch("/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: data.email }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.message === "Reset email sent") {
                        alert("Password reset link sent to your email");
                    } else {
                        alert("Error sending password reset link");
                    }
                })
                .catch((err) => {
                    console.error(err);
                    alert("An error occurred. Please try again.");
                });
            return;
        }

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
                {
                    (!forgotPassword()) ? (<>
                        <CardHeader>
                            <CardTitle>Sign in</CardTitle>
                            <CardDescription>
                                Enter your credentials to access your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-2">
                            <TextFieldRoot class="space-y-1">
                                <TextFieldLabel>Email</TextFieldLabel>
                                <TextField name="email" value={email()} onInput={(e) => setEmail(e.target.value)} required />
                            </TextFieldRoot>
                            <TextFieldRoot class="space-y-1">
                                <TextFieldLabel>Password</TextFieldLabel>
                                <TextField name="password" value={password()} onInput={(e) => setPassword(e.target.value)} type="password" required />
                            </TextFieldRoot>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Sign in</Button>
                            <Button variant="link" class="ml-auto" onClick={() => setForgotPassword(true)}>
                                Forgot password?
                            </Button>
                        </CardFooter>
                    </>) : (<>
                        <CardHeader>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>
                                Enter your email to reset your password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-2">
                            <TextFieldRoot class="space-y-1">
                                <TextFieldLabel>Email</TextFieldLabel>
                                <TextField name="email" value={email()} onInput={(e) => setEmail(e.target.value)} required />
                            </TextFieldRoot>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Send Reset Link</Button>
                            <Button variant="link" class="ml-auto" onClick={() => setForgotPassword(false)}>
                                Back to Sign in
                            </Button>
                        </CardFooter>
                    </>)
                }
            </form>
        </Card>
    );
}