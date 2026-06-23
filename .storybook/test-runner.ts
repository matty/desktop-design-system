import type { TestRunnerConfig } from "@storybook/test-runner";
import { injectAxe, getViolations, configureAxe } from "axe-playwright";

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await configureAxe(page, { rules: [] });
    const violations = await getViolations(page);
    if (violations.length) {
      // REPORT-ONLY: log, do not fail (deferred a11y backlog). Flip to assertion when the full-a11y workstream lands.
      console.log(
        `[a11y] ${violations.length} violation(s):`,
        violations.map((v) => v.id).join(", ")
      );
    }
  },
};

export default config;
