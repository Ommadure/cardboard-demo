---
name: Package firewall
description: Why Branchcut uses a newer Vitest version than the initial setup attempt.
---

When a test-runner dependency is blocked by the package firewall, try the supported latest release rather than bypassing the registry or disabling supply-chain checks.

**Why:** Installing Vitest 3 was blocked at the tinypool tarball. Installing the allowed latest Vitest release succeeded and the core/store tests ran successfully.

**How to apply:** Preserve supply-chain settings during future dependency changes. Check compatibility and run the suite after choosing an allowed release; never assume the source prompt requires an older test-runner major when it only names Vitest.
