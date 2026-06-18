# Krew UI Reference — Animation Timeline Only

Source video: `/mnt/c/Users/SOURCE/Downloads/Recording 2026-06-17 235631.mp4`

This file describes the motion/animation sequence, not just the static layout.

---

## Global animation behavior

The whole video is an autoplaying feature carousel. Nothing feels like a hard page jump. Every section changes through soft fades, slight vertical movement, blur removal, and staggered child animations.

General motion language:

- Active nav state moves left to right across the nav.
- Old section fades out and slightly moves upward/back.
- New section fades in from slightly lower position with a small blur that resolves to sharp.
- Child elements inside each scene animate in sequence, not all at once.
- Timing is calm and enterprise: no bounce, no flashy elastic motion.
- Use easing similar to `cubic-bezier(0.22, 1, 0.36, 1)`.

---

## 0.00s — Video opens on Workflows tab

The page is already loaded on a white background.

At the top, the feature nav is visible. The first item, `Workflows`, is active:

- A small black horizontal indicator line sits above the Workflows icon.
- Workflows sits inside a pale grey rounded active tile.
- Its icon square is black with a white line icon.
- All other tabs are inactive, light grey icons with black labels.

Inside the large rounded demo canvas, the workflow scene starts in an early reveal state.

Only the left input card is clearly established first. Other nodes are either missing, faint, or about to appear.

Motion:

- The canvas itself does not move.
- The first workflow card fades in and settles.
- The dotted background is static and subtle.

---

## 0.50s–1.50s — Workflow begins building from left to right

The left `Text Input` card is now stable.

Small cards begin appearing toward the middle of the canvas.

Animation detail:

1. The first middle card fades in.
2. It slides slightly upward into position.
3. A connector line from the left card starts to appear.
4. The next middle card follows with a slight delay.
5. The third middle card appears last.

The motion reads like a product workflow being assembled step by step.

For implementation:

- Use staggered children delays around 80–140ms.
- Cards start at `opacity: 0`, `y: 12`, maybe `scale: 0.98`.
- Connector lines should fade/draw after the node they connect to appears.

---

## 1.50s–3.00s — Agent and output cards appear

After the three middle tool cards are visible, the larger `Anthropic Agent` card appears to the right.

Motion:

1. The agent card fades in from a slightly lower position.
2. Connector lines from the three middle cards converge into it.
3. The card content becomes readable: title, model row, knowledge bases, tools, MCP.
4. The final `Output` card appears on the far right.
5. A final connector line links the agent to output.

The flow now reads clearly:

`Text Input` → `Search/Query tools` → `AI Agent` → `Output`

The completed composition holds briefly.

---

## 3.00s–4.30s — Completed Workflows hold

The full workflow diagram is visible and stable.

Motion is minimal:

- Maybe tiny opacity settling.
- No cards move anymore.
- This is the viewer’s pause to understand the diagram.

Then the transition to the next tab starts.

---

## 4.30s — Transition from Workflows to Interfaces

The active nav moves from `Workflows` to `Interfaces`.

Nav animation:

1. The black top indicator line slides or layout-animates from Workflows to Interfaces.
2. The pale grey active tile moves to the second tab.
3. Workflows icon changes from black active square to inactive light grey.
4. Interfaces icon changes from light grey to black active square.

Canvas animation:

1. Workflow nodes fade out together.
2. They move slightly upward or backward.
3. They blur very slightly during exit.
4. The canvas stays in place.

---

## 4.50s–5.80s — Interfaces scene fades in

The Interfaces UI appears inside the same canvas.

Animation sequence:

1. A left sidebar appears first or nearly first.
2. The right large `Published Interface` panel fades in next.
3. The preview card inside the right panel appears after the panel.
4. Form fields and upload area become visible in a small stagger.

The scene feels like a product builder screen being revealed.

Important motion detail:

- It is not a slide carousel moving horizontally.
- It is a soft content replacement inside a fixed shell.
- Elements fade and rise into place.

---

## 5.80s–7.30s — Interfaces hold

The interface builder composition holds.

Visible structure:

- Left column of interface type buttons.
- Right published preview panel.
- Center app preview card with icon, title, input fields, drag/drop upload area.

Motion is almost still.

This section gives the viewer time to read the UI.

---

## 7.30s–8.70s — Transition into Integrations

The Interfaces scene fades out.

Exit behavior:

- Left sidebar and right panel lose opacity.
- They shift up slightly.
- Blur increases for a moment.

The nav active state moves from Interfaces to Integrations:

- Indicator line moves to third tab.
- Active grey tile moves to Integrations.
- Integrations icon becomes black.

---

## 8.70s–9.50s — Integrations center logo appears

The Integrations scene begins with a central icon/hexagon.

Motion:

1. The center hexagon appears first at the middle of the canvas.
2. It scales up gently from about 0.85–0.9 to 1.
3. Its opacity goes from 0 to 1.
4. A faint blue glow or blue border appears around the central hex.

This makes the central product logo feel like the hub.

---

## 9.50s–10.50s — Integration logos expand outward

Surrounding integration tiles appear around the center.

Animation sequence:

1. Left and right neighboring hexagons fade/scale in.
2. Outer hexagons follow with a small stagger.
3. Logos appear inside each hexagon: HubSpot, SharePoint, Google Drive, Slack, Notion, Azure-style icons.
4. The row completes as a horizontal network of connected app icons.

Motion style:

- Each icon tile scales in from slightly smaller.
- Opacity rises gently.
- Stagger creates a ripple from center outward.

---

## 10.50s–11.70s — Integrations headline appears and holds

After the logo row is established, the text appears below.

Animation:

1. Headline fades up from below: `Connect with your data, wherever it sits`.
2. Body copy fades in after the headline.
3. Logo row remains static above.

The scene holds briefly once complete.

---

## 11.70s–13.10s — Transition into On-Premise

Integrations exits:

- Logo hexagons fade out.
- Text fades out.
- Everything moves slightly upward/softens.

Nav active state moves from Integrations to On-Premise.

---

## 13.10s–14.00s — On-Premise infrastructure scene appears

A row of faint server/cloud tower shapes appears in the lower-middle area of the canvas.

Animation sequence:

1. Pale vertical columns/server shapes fade in first.
2. Cloud/provider icons appear above them.
3. The center product icon appears above the center column.
4. The shapes feel like a calm infrastructure skyline.

Motion:

- Elements rise very slightly into place.
- Opacity increases from low to full.
- There is a soft vertical gradient/fade at the bottom.

---

## 14.00s–14.60s — On-Premise headline resolves

The headline and body copy fade in under the icon/tower row.

Text appears after the illustration, not before.

Motion:

- Headline fades up.
- Body copy fades in shortly after.
- The scene holds only briefly compared to others.

---

## 14.60s–16.00s — Transition into Security

On-Premise exits quickly.

- Towers and icons fade out.
- Text fades out.
- Nav active state moves to Security.

---

## 16.00s–17.00s — Security world map fades in

Security scene starts with a faint dotted world map.

Animation sequence:

1. Dotted map pattern fades in across the center/back of canvas.
2. It stays very low contrast.
3. The map is decorative but establishes global/security/compliance feeling.

The map does not move strongly; it mostly fades into visibility.

---

## 17.00s–18.00s — Compliance badges appear

Three black circular badges animate into the center.

Motion:

1. Left badge appears.
2. Center badge appears.
3. Right badge appears.
4. Each badge uses opacity + slight scale-up.
5. They cast soft shadows and sit above the faint map.

The badges are the most contrast-heavy element in the video.

---

## 18.00s–18.90s — Security headline and body appear

Text fades in below the badges.

Animation:

- Headline appears first: `Enterprise-grade security, privacy, and compliance`.
- Body copy appears after.
- Everything holds for less than a second.

---

## 18.90s–20.40s — Transition into Support

Security exits:

- Badges fade/scale down slightly.
- Dotted map fades away.
- Text fades out.

Nav active state moves to Support.

---

## 20.40s–21.00s — Support first chat bubble appears

Support scene starts with one chat bubble.

Animation:

1. The first avatar appears near the left side of the conversation stack.
2. Sender label appears: `You`.
3. First white rounded chat bubble fades in and slides up slightly.
4. Bubble has soft shadow and thin grey border.

The message is about an agent working well in rollout and extending it to other teams.

---

## 21.00s–21.80s — Second chat bubble appears

Second message from `Our Team` appears.

Animation:

1. Right-side/avatar appears.
2. Label `Our Team` appears.
3. Bubble fades/slides in under or slightly offset from the first bubble.
4. This bubble is longer and contains advisory text.

The conversation stack grows downward.

---

## 21.80s–22.60s — Third chat bubble appears

Third message from `You` appears.

Animation:

1. Another left/user bubble fades in.
2. It lands beneath the previous message.
3. Stack now feels like a realistic support conversation.

The chat bubbles do not pop aggressively. They enter calmly.

---

## 22.60s–23.30s — Support headline appears

After the chat stack is visible, headline text fades in underneath.

Animation:

1. Headline fades up: `White-glove support from dedicated AI experts`.
2. Body copy appears below.
3. Chat bubbles remain floating above.

This final scene holds, giving a complete support-card composition.

---

## 23.30s–24.73s — Final hold / loop point

The Support scene stays visible.

There is no major motion except subtle settling.

If looping:

- Fade Support out.
- Move active nav state back to Workflows.
- Rebuild workflow scene again from left to right.

Recommended loop transition:

- 300ms fade-out support.
- 150ms blank/soft canvas state.
- 500ms Workflows first card fade-in.

---

## Claude Code implementation notes

To recreate the animation, code it as a timed feature carousel with nested scene animations.

Each scene needs:

1. `enter` animation for the whole scene.
2. `staggerChildren` for inner elements.
3. `exit` animation when switching away.
4. Active nav layout animation.

Recommended scene timings:

```ts
const scenes = [
  { id: 'workflows', duration: 4300 },
  { id: 'interfaces', duration: 4000 },
  { id: 'integrations', duration: 4400 },
  { id: 'operations', duration: 3000 },
  { id: 'security', duration: 4400 },
  { id: 'support', duration: 5200 },
]
```

Default scene wrapper animation:

```ts
initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
```

Default child animation:

```ts
initial={{ opacity: 0, y: 10, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.45 }}
```

Important: the video is not just six static screenshots. The feeling comes from the order of reveal:

- Workflows builds node-by-node.
- Interfaces assembles sidebar + preview panel.
- Integrations expands from center outward.
- On-Premise fades in like infrastructure layers.
- Security reveals map first, then badges.
- Support reveals chat messages one-by-one.
