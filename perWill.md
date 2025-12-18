# Monorepo Improvement Roadmap

## Priority Order

| Done | Step | Task                   | Complexity | Time     | Usefulness | In Plan? | Why It Matters                                |
|:----:|:----:|------------------------|:----------:|:--------:|:----------:|:--------:|-----------------------------------------------|
| [ ]  | 1    | Turborepo Remote Cache | Trivial    | 30 min   | 9/10       | No       | Instant build speed, zero risk, already setup |
| [ ]  | 2    | pnpm migration         | Low        | 1 day    | 8/10       | No       | Catches phantom deps, faster, better isolation|
| [ ]  | 3    | Phase 3 - DB isolation | Medium     | 2-3 days | 9/10       | Yes      | BLOCKER - independent app data, no cross-talk |
| [ ]  | 4    | Phase 4 - Production   | Med-High   | 3-5 days | 10/10      | Yes      | THE GOAL - nothing matters until you're live  |
| [ ]  | 5    | Changesets             | Low        | 2-3 hrs  | 7/10       | No       | Coordinates deploys, prevents rebuild mistakes|
| [ ]  | 6    | Drizzle ORM            | High       | 1-2 wks  | 5/10       | No       | Nice-to-have, only if raw SQL becomes painful |

## Summary

- **Steps 1-2**: Low-effort enablers (do immediately)
- **Steps 3-4**: Actual blockers (the real work)
- **Steps 5-6**: Polish (after production)

## Current Status

Monorepo Grade: **8/10** (60% complete)

To hit 9/10: Complete DB isolation + deploy to production
To hit 10/10: Full shared package adoption + SSO + all apps live
