import { m as DialogContentOptions, l as DialogContentCommonProps, o as DialogContentRenderProps, D as DialogRoot, a as DialogCloseButton, c as DialogDescription, d as DialogOverlay, e as DialogPortal, f as DialogTitle, g as DialogTrigger, h as DialogCloseButtonCommonProps, i as DialogCloseButtonOptions, j as DialogCloseButtonProps, k as DialogCloseButtonRenderProps, p as DialogDescriptionCommonProps, q as DialogDescriptionOptions, r as DialogDescriptionProps, s as DialogDescriptionRenderProps, t as DialogOverlayCommonProps, u as DialogOverlayOptions, v as DialogOverlayProps, w as DialogOverlayRenderProps, x as DialogPortalProps, y as DialogRootOptions, z as DialogRootProps, A as DialogTitleCommonProps, B as DialogTitleOptions, C as DialogTitleProps, E as DialogTitleRenderProps, F as DialogTriggerCommonProps, G as DialogTriggerOptions, H as DialogTriggerProps, I as DialogTriggerRenderProps } from './dialog-trigger-5832944b.js';
import * as solid_js from 'solid-js';
import { ValidComponent } from 'solid-js';
import { ElementOf, PolymorphicProps } from './polymorphic/index.js';

interface AlertDialogContentOptions extends DialogContentOptions {
}
interface AlertDialogContentCommonProps<T extends HTMLElement = HTMLElement> extends DialogContentCommonProps<T> {
}
interface AlertDialogContentRenderProps extends AlertDialogContentCommonProps, DialogContentRenderProps {
    role: "alertdialog";
}
type AlertDialogContentProps<T extends ValidComponent | HTMLElement = HTMLElement> = AlertDialogContentOptions & Partial<AlertDialogContentCommonProps<ElementOf<T>>>;
/**
 * Overrides the regular `Dialog.Content` with role="alertdialog" to interrupt the user.
 */
declare function AlertDialogContent<T extends ValidComponent = "div">(props: PolymorphicProps<T, AlertDialogContentProps<T>>): solid_js.JSX.Element;

declare const AlertDialog: typeof DialogRoot & {
    CloseButton: typeof DialogCloseButton;
    Content: typeof AlertDialogContent;
    Description: typeof DialogDescription;
    Overlay: typeof DialogOverlay;
    Portal: typeof DialogPortal;
    Title: typeof DialogTitle;
    Trigger: typeof DialogTrigger;
};

declare const index_AlertDialog: typeof AlertDialog;
type index_AlertDialogContentCommonProps<T extends HTMLElement = HTMLElement> = AlertDialogContentCommonProps<T>;
type index_AlertDialogContentOptions = AlertDialogContentOptions;
type index_AlertDialogContentProps<T extends ValidComponent | HTMLElement = HTMLElement> = AlertDialogContentProps<T>;
type index_AlertDialogContentRenderProps = AlertDialogContentRenderProps;
declare namespace index {
  export {
    index_AlertDialog as AlertDialog,
    DialogCloseButtonCommonProps as AlertDialogCloseButtonCommonProps,
    DialogCloseButtonOptions as AlertDialogCloseButtonOptions,
    DialogCloseButtonProps as AlertDialogCloseButtonProps,
    DialogCloseButtonRenderProps as AlertDialogCloseButtonRenderProps,
    index_AlertDialogContentCommonProps as AlertDialogContentCommonProps,
    index_AlertDialogContentOptions as AlertDialogContentOptions,
    index_AlertDialogContentProps as AlertDialogContentProps,
    index_AlertDialogContentRenderProps as AlertDialogContentRenderProps,
    DialogDescriptionCommonProps as AlertDialogDescriptionCommonProps,
    DialogDescriptionOptions as AlertDialogDescriptionOptions,
    DialogDescriptionProps as AlertDialogDescriptionProps,
    DialogDescriptionRenderProps as AlertDialogDescriptionRenderProps,
    DialogOverlayCommonProps as AlertDialogOverlayCommonProps,
    DialogOverlayOptions as AlertDialogOverlayOptions,
    DialogOverlayProps as AlertDialogOverlayProps,
    DialogOverlayRenderProps as AlertDialogOverlayRenderProps,
    DialogPortalProps as AlertDialogPortalProps,
    DialogRootOptions as AlertDialogRootOptions,
    DialogRootProps as AlertDialogRootProps,
    DialogTitleCommonProps as AlertDialogTitleCommonProps,
    DialogTitleOptions as AlertDialogTitleOptions,
    DialogTitleProps as AlertDialogTitleProps,
    DialogTitleRenderProps as AlertDialogTitleRenderProps,
    DialogTriggerCommonProps as AlertDialogTriggerCommonProps,
    DialogTriggerOptions as AlertDialogTriggerOptions,
    DialogTriggerProps as AlertDialogTriggerProps,
    DialogTriggerRenderProps as AlertDialogTriggerRenderProps,
    DialogCloseButton as CloseButton,
    AlertDialogContent as Content,
    DialogDescription as Description,
    DialogOverlay as Overlay,
    DialogPortal as Portal,
    DialogRoot as Root,
    DialogTitle as Title,
    DialogTrigger as Trigger,
  };
}

export { AlertDialogContentOptions as A, AlertDialogContentCommonProps as a, AlertDialogContentRenderProps as b, AlertDialogContentProps as c, AlertDialogContent as d, AlertDialog as e, index as i };
