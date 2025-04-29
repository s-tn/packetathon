import Ui from "./ui";
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Checkbox, CheckboxControl, CheckboxDescription, CheckboxLabel } from "./components/ui/checkbox"
import Login from './components/login';
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

const Dashboard = () => {
  createEffect(() => {
    fetch('/api/check-login').then(res => res.json()).then(data => {
      if (!data.loggedIn) {
        location.href = '/signup'
      }
    }).catch(err => {
      location.href = '/signup'
    });
  });

  return (
    <>
      <Ui>
        <main className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-center mb-8">2026 Bergen Tech Hackathon</h1>

          <Card class="max-w-3xl mx-auto overflow-hidden">
            <CardHeader class="bg-[#1a2533] text-white">
              <CardTitle>Competitor Dashboard</CardTitle>
              <CardDescription class="text-slate-300">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. A veritatis officia nulla minus repellendus. Dolorem recusandae itaque at ratione velit rerum ducimus, amet sint. Nisi id natus possimus nemo debitis, numquam, velit, assumenda eaque rerum enim atque praesentium veniam voluptatum sapiente. Tempora veritatis eius cupiditate adipisci aliquam quaerat quasi architecto?
              </CardDescription>
            </CardHeader>
            <CardContent class="pt-6">
                uufihr2gbf
            </CardContent>
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

export default Dashboard;
