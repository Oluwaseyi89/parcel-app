import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

beforeEach(() => {
  window.localStorage.clear();

  document.cookie = "logcus=; path=/; max-age=0";
  document.cookie = "logvend=; path=/; max-age=0";
  document.cookie = "logcour=; path=/; max-age=0";
});
