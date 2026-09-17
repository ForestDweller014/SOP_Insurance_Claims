# SOP Insurance Claims

A claims-support assistant that runs on a deterministic standard operating
procedure instead of trusting the conversation. Identity verification, intent
resolution, and case disclosure are separate phases, and the controller — not
the dialogue — decides when each one opens.

**Live demo: <https://sop-insurance-claims.mhamzah014.workers.dev/>**

## The idea

Most chat assistants decide what to do next by reading the conversation. That
makes them steerable: a confident caller, a frustrated one, or one who simply
types "skip verification" can talk their way into data they should not see.

Here the phase machine sits outside the conversation. Each phase has an
explicit gate, and the assistant can only advance when that gate actually
passes:

| Phase | Gate |
| --- | --- |
| 1. Verify identity | Three approved identity fields match a policyholder on file |
| 2. Resolve intent | The caller's need maps to a specific claim |
| 3. Process case | Answers are grounded in that claim's record |
| 4. Post-process | Offer an email summary, then close |

A policy number helps locate an account but never counts toward the three
fields. Wording cannot move the machine — only a passed gate can.

## Using the demo

Open the [live demo](https://sop-insurance-claims.mhamzah014.workers.dev/) and
talk to the assistant the way a caller would. Nothing to install, no sign-in.

1. **Fastest path** — click **Run Margaret Chen sample →** under the message
   box. It sends one message containing a name, policy number, date of birth,
   and SSN last four, which clears the verification gate in a single turn.
2. **Or verify manually.** Type details a few at a time — partial answers are
   remembered between turns. Any three of: full name, date of birth, phone,
   email, or last four of SSN / national ID. Watch the **Verification gate**
   panel climb from 0 to 3.
3. **Say why you are calling.** Once verified, describe the issue
   ("my January healthcare claim was denied"). The assistant matches it to a
   case and the **Grounded case** panel appears with the case ID and status.
4. **Ask about the claim.** Denial reasons, required documents, next steps.
   Answers come from the claim record and the document-guidance fixture, so
   the assistant cites the specific documents a claim needs rather than
   generic advice.
5. **Finish.** It offers an email summary of the case, its status, and the
   next steps. Say yes or skip.

**Reset** in the top right clears the session and starts over.

### Edge cases worth trying

The dark panel on the right has three one-click scenarios, and they are the
point of the demo:

- **Frustrated caller** — insists they already verified. The gate holds.
- **Refuses an ID field** — declines to share an SSN. The assistant offers
  other approved fields rather than dropping the requirement.
- **Attempts to skip a gate** — literally asks to jump to `PROCESS_CASE`.
  Nothing happens; phase names in user text are just text.

Asking for a human ("transfer me", "I want a representative") surfaces the
escalation panel while leaving the automated gate closed.

Note what the side panels show throughout: **Remembered safely** lists what the
assistant has categorized from the conversation — those observations can inform
later phases but can never unlock claim details.

## Data

All fixtures under `apps/insurance_claims/fixtures/` are synthetic: 4
policyholders and 5 claims spanning denied, open, and closed states, plus a
required-document guideline, a claim schema, consent scenarios, and
representatives. No real policyholder data is present anywhere in this repo.

## Repository layout

```
apps/insurance_claims/
  demo/
    app/            Next.js app router — single-page chat UI
    lib/            claims-workflow.ts, the phase machine and gates (+ tests)
    DEPLOY.md       Cloudflare deployment setup
  fixtures/         Synthetic claims, policyholders, and guidance
```

The workflow logic is deliberately separate from the UI: `lib/claims-workflow.ts`
is pure TypeScript with no React, so the SOP can be tested on its own.

## Local development

Requires Node.js 22.13 or newer.

```bash
cd apps/insurance_claims/demo
npm ci
npm run dev     # http://localhost:3000
```

Other scripts:

```bash
npm test        # phase-machine and gate tests
npm run lint
npm run build
npm run check   # all three, the same sequence CI runs
```

## Deployment

The demo builds to a Cloudflare Worker with static assets and runs on
Cloudflare's free plan — no bindings, no secrets at runtime. Pushing to `main`
builds and publishes it via GitHub Actions.

See [`apps/insurance_claims/demo/DEPLOY.md`](apps/insurance_claims/demo/DEPLOY.md)
for account setup, the two required repository secrets, and manual deploys.
