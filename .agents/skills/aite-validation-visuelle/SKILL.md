---
name: aite-validation-visuelle
description: Design tooling integration and visual-first design approval workflow for the AITE / Quantif Plancher V7 floor-plan takeoff application. Use when the user asks to modernize AITE, compare UI concepts, improve readability or eye comfort, generate mockup images, learn from PlanSwift or Togal interfaces, or prepare an approved UI brief for Codex. Preserves the existing application and blocks implementation until the user explicitly selects a visual proposal.
---

# AITE - visual review before Codex

## Scope and non-negotiable constraints

- Treat the **existing AITE interface** as the product to refine, not replace. Keep the top grouped tool ribbon, project/pages and measurements at left, plan/PDF viewer at center, properties / finishes / quantities at right, current tool vocabulary, shortcuts and workflows.
- Use **PlanSwift's familiar workbench ergonomics** as the primary reference: stable navigation tree, clear ribbon grouping, high information density, visible tool selection and calm colors. Add a restrained contemporary touch; do not clone PlanSwift or Togal artwork or source.
- Respect long daily estimating sessions: clear text, low-glare light surfaces, gentle background, distinct tool states, predictable panel layout, minimal animation. Do not use decorative gradients, huge card padding, tiny low-contrast text, oversized rounded cards or flashy effects.
- Installation and maintenance of design tools, skills, references and developer instructions may proceed when requested by the user, including their repository integration. This does not authorize a product redesign. Require explicit visual approval before changing application UI/source or handing off UI implementation.
- This skill orchestrates visual proposals and a human approval gate. It is not a drawing engine or a replacement for general design, development, automated takeoff or testing skills.

## Default working sequence

### 1. Examine the current interface

When supplied, examine the user's real AITE screenshot, PlanSwift screenshot and representative loaded-plan screenshot. If a screenshot is missing, explicitly state which details cannot be verified. Identify three to six concrete visual issues, not speculative functional defects. Do not assume any feature shown in a generated mockup is implemented.

### 2. Design two or three comparable options

Propose 2-3 *incremental* visual directions on the same screen layout and with the same visible tools and realistic sample plan. Always include:
- **A: PlanSwift modernise** - closest to the familiar blue/gray desktop ribbon and dense information layout; default recommended starting point.
- **B: Bleu doux professionnel** - a little cleaner/lighter; restrained blue accents and clear panels.
- **C: Confort visuel** - optional warm-neutral or muted gray-blue surface with gently reduced glare, but without reducing text/measurement contrast.

Compare only design axes (colors, fonts, spacing, borders, toolbar and panel hierarchy). Do NOT change the business process, invent new workflows, omit existing important tools or hide necessary measurement statuses to make a screenshot attractive.

### 3. Generate reviewable visual previews

- If an image-generation capability is available, render separate high-fidelity landscape **16:9 mockup images** with labels A/B/C. Use a realistic *illustrative* loaded plan with opaque/transparent takeoff overlays only as a visual aid; do not present invented quantities as project data. If user-provided screenshot editing is requested, base the result on that screenshot.
- If operating in Codex without image generation, build **isolated non-production HTML/CSS prototypes** in a scratch/preview directory and capture screenshots with an available browser; do not edit the real AITE HTML and do not install paid tools. If neither rendering path is available, report the limitation and provide a precise static proposal; do not claim screenshots exist.
- Show each image at readable resolution, numbered, with one-line strengths and trade-offs. Whenever possible compare an unchanged AITE reference side-by-side with the proposal.
- The preview is NOT executable product UI or acceptance evidence for functionality.

### 4. Evaluate eye comfort and familiar operation

Check the matrix in [references/grille-validation.md](references/grille-validation.md). Protect legible font sizes, text/background contrast (target WCAG AA 4.5:1 for ordinary text), recognizable toolbar icons, scale/zoom visibility and high precision overlay contrast. Measure real contrast when exact colors are proposed; never assert a contrast standard passed without measurement.

### 5. Mandatory human decision gate

**STOP after visual proposals.** Ask the user to choose A, B, C, a combination, or request revisions. Selection must be explicit. Do not send a development task, PR, branch, patch, deployment, GitHub issue or implementation prompt to Codex under this workflow before the user approves the proposal. Do not silently choose a design for the user.

### 6. Codex handoff only after approval

Once the user has approved a numbered visual, prepare a concise **read-only handoff draft**: selected image and variant, preserved components/functions, exact visual changes, visual tokens, out-of-scope changes, verification criteria and rollback. Have the user authorize forwarding/implementation separately if it has not already been authorized. Use the already available `design-ui` and `webapp-testing` skills rather than duplicating them.

If authorized to implement later, require isolated small CSS/UI changes in the existing technology, no conversion to React, no redesign of measurement math, geometry, PDF rendering, Excel formulas or quantity workflows. Capture before/after screenshots at the user's normal desktop viewport and a smaller viewport, and run existing Playwright checks. Any unrun test is `NON EXECUTE`.

## Privacy and delivery

- Never publish customer plans, pricing sheets, unredacted screenshots or private files to a public GitHub repository or external design service without explicit consent.
- Prefer local/free tools and existing skills; this one is the only project-specific design approval skill, not another UI renderer.
- Reply in French, use the user's actual labels (`Projet et pages`, `Mesures du plan`, `Devis & finis`, `Quantites`), and emphasize the plan as the central workspace.

## Integrated design toolbox

Read [design-toolbox.md](references/design-toolbox.md) for the six requested resources, actual installation states, and local CLI commands. Use [web-interface-guidelines.md](references/web-interface-guidelines.md) as the dated offline audit checklist; refresh from the official source when available and state when using the snapshot. Use [taste-aite.md](references/taste-aite.md) for restrained design direction and [image-to-code-aite.md](references/image-to-code-aite.md) only with a user-approved visual. These are AITE adaptations, not the complete upstream plugins. No automatic Taste hooks or remote 21st connection are enabled.

For audits produce observed findings with file:line evidence. Keep contrast measurements distinct from general visual impressions. A browser smoke test is not a validation of PDF geometry or takeoff quantities.
