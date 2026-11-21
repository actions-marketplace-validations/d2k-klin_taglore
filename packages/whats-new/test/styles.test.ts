import { describe, expect, it } from "vitest";
import { CSS } from "../src/styles.js";

describe("default styles", () => {
  it("set display on the dialog's header and body, so page-wide element rules can't reshape them", () => {
    // A common app rule like `header { display: flex }` used to put the eyebrow, title and
    // summary side by side.
    expect(CSS).toMatch(/\.taglore-wn__header \{[^}]*display: block/);
    expect(CSS).toMatch(/\.taglore-wn__body \{[^}]*display: block/);
    expect(CSS).toMatch(/\.taglore-wn__footer \{[^}]*display: flex/);
  });
});
