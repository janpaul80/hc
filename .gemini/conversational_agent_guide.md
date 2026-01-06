# HashCoder IDE - Conversational Agent Integration Guide

## Goal
Make the agent chat and plan BEFORE coding (like Claude/Cursor in the screenshots)

## What's Built

### 1. Conversational Agent System ✅
**File:** `lib/agent/conversational.ts`

**Features:**
- Detects if user wants to chat vs build
- Provides different system prompts for each mode
- Formats planning responses with structure

**Modes:**
- `discussion` - Casual conversation
- `planning` - Structured planning with features/components
- `building` - Generate code

### 2. Dark Preview Panel ✅  
**File:** `components/workspace/PreviewPanel.tsx`

**Already has all the states:**
- ✅ Dark background (#0f0f0f)
- ✅ HashCoder logo (glowing/pulsing)
- ✅ "Building your idea..." text
- ✅ Progress indicators
- ✅ Animated loading

---

## Integration Steps

### Step 1: Wire Conversational Mode to handleSendMessage

In `app/workspace/[id]/page.tsx`:

```typescript
import { ConversationalAgent } from '@/lib/agent/conversational';

const handleSendMessage = async () => {
  // ... existing code ...

  // BEFORE calling the API:
  const intent = ConversationalAgent.detectIntent(userPrompt);
  
  if (!intent.canGenerateCode) {
    // User wants to chat/plan
    // Call AI with discussion prompt
    const response = await fetch("/api/agent/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: userPrompt, mode: intent.type })
    });
    
    const data = await response.json();
    setMessages(prev => [...prev, { 
      role: "ai", 
      content: data.response 
    }]);
    return; // Don't generate files
  }

  // User wants to build - proceed with existing logic
  // ... rest of existing code ...
};
```

### Step 2: Create Chat-Only API Endpoint

**File:** `app/api/agent/chat/route.ts`

```typescript
import { ConversationalAgent } from '@/lib/agent/conversational';
import { AIEngine } from '@/lib/ai/engine';

export async function POST(req: Request) {
  const { prompt, mode } = await req.json();
  
  const systemPrompt = ConversationalAgent.getSystemPrompt(
    { type: mode, canGenerateCode: false }
  );

  // Call AI with conversational prompt
  // (Modify runLangdock to accept custom system prompts)
  
  return NextResponse.json({ 
    response: "AI conversational response here"
  });
}
```

### Step 3: Replace Sandpack Preview with PreviewPanel

In `app/workspace/[id]/page.tsx`:

**Replace:**
```typescript
<SandpackPreview />
```

**With:**
```typescript
{/* NEW: Dark branded preview */}
<PreviewPanel
  isBuilding={isGenerating}
  isReady={false}  // Set to true when app starts
  port={3000}
  buildStatus={buildingMessage}
  error={buildError}
/>
```

### Step 4: Add Building States

```typescript
const [isBuilding, setIsBuilding] = useState(false);
const [buildStatus, setBuildStatus] = useState('');

// When generation starts:
setIsBuilding(true);
setBuildStatus('Installing dependencies...');

// Update status as actions execute:
setBuildStatus('Compiling application...');

// When complete:
setIsBuilding(false);
```

---

## Expected UX Flow

### 1. User Types: "I want to build a dashboard"
**Agent Response:**
```
# Planning your project

**Idea:** Dashboard application

## Plan:

### 1. Key Features:
- Interactive charts and graphs
- Real-time data updates
- Responsive design

### 2. Technical Stack:
- Next.js 14
- React
- TailwindCSS
- Recharts

### 3. Components:
- Dashboard layout
- Chart components
- Stats cards

---

Let me build this:

When you're ready, just say "build this" and I'll create it!
```

### 2. User Types: "build this"
**Agent Response:**
```
✨ Building your dashboard...

[ActionBlocks showing: write_file, install, run]
[Preview shows: Dark screen → "HeftCoder is building..." → Live app]
```

---

## Key Changes Needed

### In `lib/ai/engine.ts`:

Add `mode` parameter to `runLangdock`:

```typescript
private static async runLangdock(
  prompt: string,
  context: string,
  assistantId?: string,
  systemInstruction?: string,
  mode?: 'discussion' | 'building'  // NEW
): Promise<AIResponse>
```

### In `app/api/agent/generate/route.ts`:

Check mode before generating:

```typescript
const intent = ConversationalAgent.detectIntent(prompt);

if (!intent.canGenerateCode) {
  // Return conversational response instead
}
```

---

## Visual Examples

**Chat Mode:**
- Shows structured plan
- "Let me build this:" prompt
- Conversational tone

**Building Mode:**
- Shows "thinking..." indicator
- Dark preview with logo
- ActionBlocks with terminal output
- Progress updates

---

## Next: UI Polish

Once conversational mode is integrated:
1. Add typing indicators ("thinking...")
2. Add "Wrote entities/Project" status badges
3. Add building tips in preview panel
4. Polish animations

**Status:** Architecture ready, needs frontend wiring
