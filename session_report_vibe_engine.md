# HeftCoder Workspace Update Report
**Date:** January 07, 2026
**Focus:** Embedded API Architecture, Native Chat Restoration, and Critical Bug Fixes

## 1. Embedded API Architecture (Native UI + Headless LangDock) 🛠️
**Goal:** Transition entirely away from embedded UIs (iframes) to a native "Embedded API" model, using LangDock strictly as a backend reasoning engine.

### **Restored Native Chat UI (`components/workspace/AIChatPanel.tsx`)**
*   **Action:** Completely removed the iframe-based LangDock chat component.
*   **Restoration:** Reinstated the native React-based chat interface:
    *   Preserved the black/dark HeftCoder aesthetic (consistent with `heftcoder.icu`).
    *   Restored custom input area with attachment, voice, and send buttons.
    *   Restored "HeftCoder Pro AI" header and stage progress indicators (Planning, Approving, Coding).
*   **Outcome:** Users now interact with a seamless, responsive native UI that feels 100% integrated into the IDE.

### **Engine Hardening (`lib/ai/engine.ts`)**
*   **Role Validation:** Implemented strict role filtering for the LangDock API adapter.
    *   *Problem:* LangDock's `v1/chat/completions` endpoint throws 400 errors if `system` or `tool` roles are present in the `messages` array.
    *   *Fix:* Added logic to strip non-compliant roles (system, tool) and map history strictly to `user` or `assistant` roles before transmission.
*   **Logging:** Added safe payload logging (masking API keys) to facilitate diagnosing integration issues in production logs.

---

## 2. Infrastructure & Authorization Fixes 🔐
**Goal:** Resolve persistent 400 Bad Request errors in production.

### **LangDock Assistant Authorization**
*   **Root Cause:** The 400 error was identified as an **authorization failure**, not a bad payload. The API key was valid but had not been explicitly granted access to the specific Assistant ID (`bddc9537...`).
*   **Resolution:**
    *   Used browser automation to access LangDock Dashboard.
    *   Shared the **HeftCoder Prod v3** assistant with the production API Key.
    *   Elevated permissions from `User` to `Editor`.
*   **Impact:** This unblocked the entire backend, allowing the native UI to successfully communicate with the AI engine.

### **Deployment Pipeline (`AIChatPanel.tsx` Type Fix)**
*   **Issue:** A TypeScript type mismatch (`"approval"` vs `"approving"`) caused the Coolify build to fail during the restoration process.
*   **Fix:** Corrected the prop comparison logic to match the defined union type.
*   **Result:** Deployment pipeline restored; latest commits pushed to `main` and building successfully on Coolify.

---

## 3. Summary of Status ✅
The workspace has successfully transitioned to the **Embedded API** model requested by the user.

1.  **Visuals:** Native HeftCoder Chat UI (No external branding/iframes).
2.  **Architecture:** `UI -> Internal API -> LangDock Headless API`.
3.  **Production:** Authorization issues resolved; deployment pipeline fixed.

**Next Steps (Post-Verification):**
*   Define global vs. per-project assistant strategies.
*   Layer generic (non-chat) AI actions on top of the established engine.
