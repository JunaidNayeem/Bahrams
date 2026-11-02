import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Component tests run without vitest globals, so Testing Library cannot register its own
// automatic cleanup; unmount rendered trees between tests here.
afterEach(() => {
  cleanup();
});
