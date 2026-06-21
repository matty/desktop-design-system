import { describe, it, expectTypeOf } from "vitest";
import type { ComboOption, TreeNode, MenuItem, TabItem, ToastOptions, Tone, Size } from "./types";

describe("types", () => {
  it("ComboOption shape", () => {
    expectTypeOf<ComboOption>().toMatchTypeOf<{ value: string; label: string }>();
  });
  it("TreeNode is recursive", () => {
    const n: TreeNode = { id: "a", label: "A", children: [{ id: "b", label: "B" }] };
    expectTypeOf(n.children).toMatchTypeOf<TreeNode[] | undefined>();
  });
  it("ToastOptions tone is a union", () => {
    expectTypeOf<ToastOptions["tone"]>().toMatchTypeOf<
      "info" | "success" | "warn" | "danger" | undefined
    >();
  });
  it("MenuItem and TabItem exist", () => {
    expectTypeOf<MenuItem>().toMatchTypeOf<{ id: string }>();
    expectTypeOf<TabItem>().toMatchTypeOf<{ id: string; label: string }>();
  });
});

describe("shared unions", () => {
  it("Tone and Size are the CSS-backed unions", () => {
    expectTypeOf<Tone>().toMatchTypeOf<"info" | "success" | "warning" | "danger">();
    expectTypeOf<Size>().toMatchTypeOf<"sm" | "md" | "lg">();
  });
});
