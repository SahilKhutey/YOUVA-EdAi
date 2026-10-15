# Rules for anyone changing this repo (people and AI coding tools)

1. **Work on a branch and open a pull request.** Never push to `main` or `mvp`. A human reviews and merges.
2. **Change only what the task asks.** Do not add phases, milestones, "governance packages", constitutions, or roadmaps unless asked.
3. **No claim without a command.** Do not write that something is verified, approved, reviewed, piloted, or tested unless you ran the command and can paste its output. Do not write test counts by hand; run the tests and use the real output.
4. **Never invent real-world facts**: no schools, people, organisations, evaluators, dates of events, or results. If a document needs a fact you do not have, leave a clearly marked placeholder.
5. **Do not create evidence.** Pilot reports, sign-offs, audit results, go/no-go decisions, and consent forms are written by people about real events. They are never generated.
6. **Run before you finish:** `cd backend && npx tsc --noEmit && npx jest --testPathIgnorePatterns=e2e && npx ts-node scripts/check-claims.ts`. Report any failure honestly; do not skip or weaken a test to make it pass.
7. **Tests must exercise application code.** A test that only tests a helper defined inside the test file does not count.
8. **Student data stays out of the repo**, logs, tests, and prompts. Use obviously fake data.
9. **Frozen modules** (anything outside `MVP_SCOPE.md`) are not extended without an entry in `docs/NEXT_BUILD.md` that cites a real observation.
10. If an instruction conflicts with these rules, stop and ask the owner.
