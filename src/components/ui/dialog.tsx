import { cn } from "@/libs/cn";
import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import type { ComponentProps, ParentProps } from "solid-js";
import { splitProps } from "solid-js";

export const Dialog = DialogPrimitive;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogOverlay = (props: ComponentProps<typeof DialogPrimitive.Overlay>) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<DialogPrimitive.Overlay
			class={cn(
				"fixed inset-0 z-50 bg-black/50 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
				local.class,
			)}
			{...rest}
		/>
	);
};

export const DialogContent = (props: ParentProps<ComponentProps<typeof DialogPrimitive.Content>>) => {
	const [local, rest] = splitProps(props, ["class", "children"]);
	return (
		<DialogPrimitive.Portal>
			<DialogOverlay />
			<DialogPrimitive.Content
				class={cn(
					"fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-background p-6 shadow-lg rounded-lg data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%]",
					local.class,
				)}
				{...rest}
			>
				{local.children}
				<DialogPrimitive.CloseButton class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				</DialogPrimitive.CloseButton>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
};

export const DialogTitle = (props: ComponentProps<typeof DialogPrimitive.Title>) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<DialogPrimitive.Title
			class={cn("text-lg font-semibold leading-none tracking-tight", local.class)}
			{...rest}
		/>
	);
};

export const DialogDescription = (props: ComponentProps<typeof DialogPrimitive.Description>) => {
	const [local, rest] = splitProps(props, ["class"]);
	return (
		<DialogPrimitive.Description
			class={cn("text-sm text-muted-foreground", local.class)}
			{...rest}
		/>
	);
};
