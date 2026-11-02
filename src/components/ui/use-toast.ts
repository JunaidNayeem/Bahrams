"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "./toast";

/**
 * Module-level toast store so `toast()` can be called from anywhere on the client (event
 * handlers, server-action results) without threading context through the tree.
 */

const TOAST_LIMIT = 3;
/** Radix keeps a closed toast mounted for its exit animation; drop it from state after this. */
const TOAST_REMOVE_DELAY_MS = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastInput = Omit<ToasterToast, "id">;

type State = { toasts: ToasterToast[] };

type Action =
  | { type: "add"; toast: ToasterToast }
  | { type: "update"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "dismiss"; toastId?: string }
  | { type: "remove"; toastId?: string };

let counter = 0;
function nextId(): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return counter.toString();
}

const removeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleRemoval(toastId: string): void {
  if (removeTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    removeTimeouts.delete(toastId);
    dispatch({ type: "remove", toastId });
  }, TOAST_REMOVE_DELAY_MS);
  removeTimeouts.set(toastId, timeout);
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "update":
      return {
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };
    case "dismiss":
      return {
        toasts: state.toasts.map((t) =>
          action.toastId === undefined || t.id === action.toastId ? { ...t, open: false } : t,
        ),
      };
    case "remove":
      return {
        toasts:
          action.toastId === undefined ? [] : state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

const listeners = new Set<(state: State) => void>();
let memoryState: State = { toasts: [] };

function dispatch(action: Action): void {
  if (action.type === "dismiss") {
    const ids = action.toastId ? [action.toastId] : memoryState.toasts.map((t) => t.id);
    ids.forEach(scheduleRemoval);
  }
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function toast(input: ToastInput) {
  const id = nextId();
  const dismiss = () => dispatch({ type: "dismiss", toastId: id });
  const update = (next: Partial<ToastInput>) =>
    dispatch({ type: "update", toast: { ...next, id } });

  dispatch({
    type: "add",
    toast: {
      ...input,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}

function subscribe(listener: (state: State) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverState: State = { toasts: [] };

function useToast() {
  const state = React.useSyncExternalStore(
    (onChange) => subscribe(onChange),
    () => memoryState,
    () => serverState,
  );
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "dismiss", toastId }),
  };
}

export { toast, useToast, type ToastInput, type ToasterToast };
