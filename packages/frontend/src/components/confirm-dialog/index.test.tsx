import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../confirm-dialog";

afterEach(() => {
  cleanup();
});

describe("ConfirmDialog", () => {
  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Delete"
        message="Are you sure?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        open={false}
        title="Confirm action"
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls onClose on Escape and overlay click", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        confirmLabel="Delete"
        message="Are you sure?"
        onClose={onClose}
        onConfirm={vi.fn()}
        open
        title="Confirm action"
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("keeps dialog clicks from closing and respects disabled confirm", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        confirmDisabled
        confirmLabel="Delete"
        message="Are you sure?"
        onClose={onClose}
        onConfirm={onConfirm}
        open
        title="Confirm action"
      />
    );

    fireEvent.click(screen.getByText("Confirm action"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
