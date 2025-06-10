import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { TextField, TextFieldLabel, TextFieldRoot } from "./ui/textfield";

export default function Register({ email } = {}) {
    return (
        <Card class="border-none">
            <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>
                    Enter your credentials to create your account.
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-2">
                <TextFieldRoot class="space-y-1">
                    <TextFieldLabel>Email</TextFieldLabel>
                    <TextField disabled={email} value={email || ''} name="email" required />
                </TextFieldRoot>
                <TextFieldRoot class="space-y-1">
                    <TextFieldLabel>Password</TextFieldLabel>
                    <TextField name="password" type="password" required />
                </TextFieldRoot>
                <TextFieldRoot class="space-y-1">
                    <TextFieldLabel>Confirm Password</TextFieldLabel>
                    <TextField name="confirm-password" type="password" required />
                </TextFieldRoot>
            </CardContent>
        </Card>
    );
}