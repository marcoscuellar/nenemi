# NENEMI — The "Way Back In" (stuck screen spec)

This isn't an app; it's a cognitive bypass. NENEMI is the "external prefrontal cortex" ADHD folks actually need.

Most productivity apps are built for linear brains, people who just need a list. This logic targets **limbic friction**, the physical resistance we feel when the brain says "no" to a task. Using the Four Doors, you aren't asking for data entry; you're offering **co-regulation**. It should feel like a conversation with a friend who happens to be a genius organizer, not a cold piece of software.

## 1. The entry moment (the "vibe check")
When the user opens the app after inactivity, or says they're stuck, don't show the calendar first. Show the human.
- Prompt: **Where are you right now?**
- Subtext: You don't need a new plan. You just need a way back in.

## 2. The Four Doors
Large, soft-edged buttons. No icons that look like "work" (no gears, no checkboxes). Colors that reflect the energy state.

| Door | Label | Subtext | The "why" (micro-toggle) |
|---|---|---|---|
| 1 | I can't start. | We'll find the smallest possible first step. | Starting is the hardest part. Let's trick the brain by making the task tiny. |
| 2 | My head is too full. | Put it down. I've got it. | Working memory is limited. Offload the noise so you can focus. |
| 3 | I have no energy. | Let's shrink the day to match you. | Low dopamine means high resistance. We're lowering the bar to create momentum. |
| 4 | I fell off. | You didn't fail. You paused. | Shame is a productivity killer. We're picking up exactly where you left off. |

## 3. The Smart Cal logic (the override happens in the background)
- **I have no energy:** the calendar hides non-essential tasks and stretches out the rest. Buffer blocks of 15 minutes between everything.
- **I fell off:** nothing shows "overdue" in red. Uncompleted tasks slide into the next available white space. No shame, just math.

## 4. Explaining the "why": micro-validation, not a tutorial
Small bubbles inside the flow instead of a manual. Example inside "help me start":
> Your brain sees "Clean Kitchen" as a mountain. I'm helping you see it as "Pick up one fork." Mountains are scary; forks are easy.

## Why this works for ADHD
- **Reduces choice paralysis:** four emotional states, not a list of 20 tasks.
- **Dopamine over discipline:** treating the mid-day crash as biology, not a moral failure, stops the shame spiral that usually ends a productive day.
- **The prosthetic effect:** it does the pivoting for them. ADHD brains struggle to switch gears; the app is the transmission.

## Where it lives in the app
- The stuck screen is the Way Back In. Doors first, then one small move (see docs/nenemi-external-motors.md for the nudge library).
- Door 1 → nudges from the "starting" motors. Door 2 → the composer. Door 3 → nudges from "body & energy" plus the low-energy day. Door 4 → nudges from "context reinstatement" plus the slide-forward.
