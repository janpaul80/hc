# HashCoder IDE v1 - Implementation Plan

**Status:** 🚧 Phase 1 In Progress  
**Target:** Transform workspace into full AI IDE  
**Quality Standard:** Production-ready, not prototype

---

## ✅ Phase 1: Agent Action System (IN PROGRESS)

### Goal
Replace text-only responses with structured actions that can be executed.

### Components Created
- ✅ `/lib/agent/actions.ts` - Action schema definitions
- ✅ `/lib/agent/executor.ts` - Server-side action executor
- ⏳ `/app/api/agent/execute/route.ts` - API endpoint for action execution
- ⏳ Update AI engine to emit actions instead of just files
- ⏳ Chat UI to render actions as terminal blocks

### Action Types Implemented
- `write_file` - Create/update files
- `delete_file` - Remove files
- `install` - Install npm packages
- `run` - Execute commands
- `preview` - Signal ready state
- `deploy` - Deploy to platforms

### Acceptance Criteria
- [ ] Agent emits structured actions
- [ ] Actions execute server-side
- [ ] Results stream to chat
- [ ] Chat renders actions as terminal logs
- [ ] No raw terminal access for users

---

## ⏳ Phase 2: Virtual Terminal

### Goal
Execute commands server-side and stream output to chat as terminal blocks.

### Tasks
- [ ] Create WebSocket connection for streaming
- [ ] Backend command execution sandbox
- [ ] Terminal-style UI component
- [ ] Live stdout/stderr rendering
- [ ] Status indicators (running/done/error)

### UX Requirements
- Terminal blocks appear inline in chat
- Live output streaming (not all-at-once)
- Clear visual states (pending/running/done)
- Copy button for command output
- Collapse/expand for long outputs

---

## ⏳ Phase 3: Live Preview Enhancement

### Goal
Never show blank/white preview. Always intentional dark UI.

### Default State (No App Running)
- Dark background (#0f0f0f)
- HashCoder logo (glowing/pulsing)
- Text: "HashCoder is working..."
- Subtle animation

### Building State
- Loading spinner + Hascoder logo
- Live status text: "Installing dependencies..."
- Progress indicators

### Ready State
- Iframe with app preview
- Hot reload on file changes
- Status bar: "Preview running on port 3000"

### Tasks
- [ ] Create PreviewPanel component with dark default
- [ ] Implement hot reload system
- [ ] Add loading/building states
- [ ] Status indicator bar
- [ ] Error state handling

---

## ⏳ Phase 4: Deployment Pipeline

### Goal
One-click deployment to GitHub + Vercel

### GitHub Integration
- [ ] Create repo button
- [ ] Commit & push files
- [ ] Handle authentication
- [ ] Display git status in chat

### Vercel Integration
- [ ] Connect to Vercel API
- [ ] Auto-detect framework
- [ ] Inject env vars
- [ ] Deploy preview + production
- [ ] Display deployment URL

### UX Requirements
- Clear deployment status
- Live deployment logs
- Success state with URLs
- Error handling with retry

---

## ⏳ Phase 5: Agent-Driven SaaS Scaffolding

### Goal
Agent can scaffold complete SaaS apps with minimal user input.

### Capabilities
- [ ] Detect intent (SaaS, auth, billing, etc.)
- [ ] Install correct dependencies
- [ ] Scaffold folder structure
- [ ] Create API routes
- [ ] Generate .env.example with required vars
- [ ] Never guess silently - always ask for missing info

### Example Flow
```
User: "Build a SaaS with Stripe billing and Supabase auth"

Agent Actions:
1. Install: next, supabase, stripe
2. Write: /lib/supabase.ts, /lib/stripe.ts
3. Write: /app/api/auth/[...supabase]/route.ts
4. Write: /app/api/stripe/checkout/route.ts
5. Write: .env.example
6. Message: "Add these env vars: SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY"
7. Run: npm run dev
8. Preview: localhost:3000
```

---

## ⏳ Phase 6: UI Polish & Branding

### Design System
- **Primary Orange:** `#ff6b35` (HashCoder brand)
- **Background:** `#0f0f0f` (dark charcoal)
- **Panel Background:** `#1a1a1a`
- **Text Primary:** `#ffffff`
- **Text Secondary:** `#a0a0a0`
- **Success:** `#10b981`
- **Error:** `#ef4444`

### Animation Guidelines
- Subtle, not distracting
- Logo pulse during builds
- Smooth transitions (200-300ms)
- Loading spinners with brand color

### Chat Styling
- Agent messages: subtle orange accent on avatar
- User messages: neutral
- Action blocks: terminal-style (dark bg, mono font)
- Loading dots: orange pulse

### Tasks
- [ ] Update color scheme globally
- [ ] Add logo animations
- [ ] Polish chat message rendering
- [ ] Add loading states
- [ ] Implement transitions

---

## ⏳ Phase 7: Multi-Agent Architecture

### Goal
Support multiple specialized agents without chaos.

### Agent Types (Future)
- **Coder Agent** - File generation, code editing
- **DevOps Agent** - Deployment, infrastructure
- **Debug Agent** - Error analysis, fixes
- **Design Agent** - UI/UX generation

### Architecture Requirements
- [ ] Agent registry system
- [ ] Clear authority boundaries
- [ ] Action permission system
- [ ] Agent handoff protocol
- [ ] Conflict resolution

---

## 📊 Progress Tracking

| Phase | Status | Progress | ETA |
|-------|--------|----------|-----|
| 1. Action System | 🚧 In Progress | 40% | +1 day |
| 2. Virtual Terminal | ⏳ Pending | 0% | +2 days |
| 3. Live Preview | ⏳ Pending | 0% | +1 day |
| 4. Deployment | ⏳ Pending | 0% | +2 days |
| 5. SaaS Scaffolding | ⏳ Pending | 0% | +1 day |
| 6. UI Polish | ⏳ Pending | 0% | +1 day |
| 7. Multi-Agent | ⏳ Pending | 0% | +3 days |

**Total Estimated Time:** 11 days (quality-focused)

---

## ✅ Definition of Done

HashCoder IDE v1 is complete when:

- [ ] User can request a SaaS app via chat
- [ ] Agent installs dependencies automatically
- [ ] App preview loads in dark-themed panel
- [ ] Terminal actions render inline in chat
- [ ] User can deploy with one button click
- [ ] Preview never shows blank/white screen
- [ ] All UI feels polished, not hacky
- [ ] No temporary workarounds in code

---

## 🎯 Quality Standards

- **No Hacky Code:** If it feels temporary, refactor it
- **Control > Magic:** Deterministic behavior, no surprises
- **Polish First:** UX quality > feature count
- **Future-Proof:** Build for multi-agent from day 1

---

## 📝 Notes

- All backend actions run server-side for security
- No client-side command execution
- WebSocket for streaming terminal output
- Dark theme is non-negotiable
- Agent must never guess - always ask
