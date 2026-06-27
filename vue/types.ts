export interface Step { id: string; label: string }

export type WindowControl = "minimize" | "maximize" | "close";

export type ChecklistState = "pending" | "running" | "ok" | "warn" | "error";
export interface ChecklistItem {
  id: string;
  title: string;
  note?: string;
  state: ChecklistState;
}

export interface ComboOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface OptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

export interface MenuItem {
  id: string;
  label?: string;
  danger?: boolean;
  separator?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
  onSelect?: () => void;
}

export interface MenubarMenu { id: string; label: string; items: MenuItem[] }

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export type ToastTone = "info" | "success" | "warn" | "danger";

export type ToastPlacement =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  message: string;
  title?: string;
  tone?: ToastTone;
  timeout?: number;
  assertive?: boolean;
  action?: ToastAction;
}

export type Tone = "info" | "success" | "warning" | "danger";
export type Size = "sm" | "md" | "lg";

export interface CommandItem { id: string; label: string; hint?: string; group?: string }
