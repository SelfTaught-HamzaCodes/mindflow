import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppDataProvider } from "@/context/AppDataContext";
import { PrefsProvider } from "@/context/PrefsContext";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { loadUserPrefs, USER_PREFS_KEY } from "@/lib/userPrefs";

vi.mock("@/components/layout/LogoMark", () => ({
  default: () => <span>logo</span>,
}));

vi.mock("@/lib/logoFont", () => ({
  logoFont: { className: "" },
}));

function renderOnboarding() {
  return render(
    <AppDataProvider>
      <PrefsProvider>
        <OnboardingFlow mode="first-visit" />
      </PrefsProvider>
    </AppDataProvider>,
  );
}

describe("OnboardingFlow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("walks through questions and stores preferences", async () => {
    const user = userEvent.setup();
    renderOnboarding();

    expect(
      screen.getByRole("heading", { name: /quieter start/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.type(await screen.findByLabelText(/preferred name/i), "Sam");
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /quiet/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /^tasks/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(
      await screen.findByRole("button", { name: /start workspace/i }),
    );

    const prefs = loadUserPrefs();
    expect(prefs.onboarded).toBe(true);
    expect(prefs.displayName).toBe("Sam");
    expect(prefs.density).toBe("quiet");
    expect(prefs.primaryFocus).toBe("tasks");
    expect(window.localStorage.getItem(USER_PREFS_KEY)).toBeTruthy();
  });

  it("skip uses quiet defaults without requiring a name", async () => {
    const user = userEvent.setup();
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /skip for now/i }));
    const prefs = loadUserPrefs();
    expect(prefs.onboarded).toBe(true);
    expect(prefs.density).toBe("quiet");
    expect(prefs.displayName).toBe("");
  });
});
