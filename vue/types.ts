export interface ComboOption {
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

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export type ToastTone = "info" | "success" | "warn" | "danger";

export interface ToastOptions {
  id?: string;
  message: string;
  tone?: ToastTone;
  timeout?: number;
  assertive?: boolean;
}

export type Tone = "info" | "success" | "warning" | "danger";
export type Size = "sm" | "md" | "lg";
