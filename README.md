# mksdk

Embed the [MessageKit](https://www.messagekit.app) Discord message composer in your app. Let users design Components V2 messages, then receive a typed draft to save or send with your own bot.

- React component and hooks for iframe integrations.
- Session helpers for custom iframes and standalone composer links.
- Button presets, text and attachment placeholders, and editor controls.
- Typed events, JSON schemas, and privacy-conscious diagnostics.
- SDK-owned Discord component types; no runtime dependencies beyond the React peer.

## Install

```bash
bun add mksdk
# or
npm install mksdk
```

Requires **React 18 or later**. The package ships ESM and TypeScript declarations. Components and hooks run on the client; `createComposerSession` can also run in environments with `fetch` and Web Crypto.

## Quick start

```tsx
"use client"

import { ComponentType, ComposerIframe, type MessageKitDraft } from "mksdk"

export function MessageComposer({
    onSave,
}: {
    onSave: (draft: MessageKitDraft) => void
}) {
    return (
        <ComposerIframe
            state="announcement-123"
            style={{ height: 720 }}
            options={{ title: "Compose announcement" }}
            prefill={{
                items: [{ type: ComponentType.TextDisplay, content: "Hello, Discord!" }],
                flags: { silent: false, ephemeral: false },
            }}
            onSaved={(event) => {
                if (event.draft) onSave(event.draft)
            }}
            onCancelled={() => console.info("Composer cancelled")}
            onError={(error) => {
                console.error(error instanceof Error ? error.message : error.error)
            }}
        />
    )
}
```

The component creates a session against `https://www.messagekit.app`, then renders its iframe. It fills its parent by default; give it or its parent an explicit height. Use `className`, `style`, and `title` to control the iframe's presentation and accessible title.

Saving returns a draft—it does **not** send a Discord message. Your app owns persistence, bot interactions, and delivery. Handle [uploaded attachments](#uploaded-attachments) before storing or sending a draft.

## Configure the editor

Pass these controls through `options`:

```tsx
import { ButtonStyle, ComponentType, ComposerIframe } from "mksdk"

<ComposerIframe
    style={{ height: 720 }}
    options={{
        title: "Compose announcement",
        allowCancel: true,
        buttonPresets: [
            { label: "Approve", customId: "announcement:approve", style: ButtonStyle.Success },
            { label: "Reject", customId: "announcement:reject", style: ButtonStyle.Danger },
        ],
        placeholders: [
            { key: "user.name", label: "User name", example: "Alex" },
        ],
        attachmentPlaceholders: [
            { label: "Server icon", value: "{guild.icon}" },
            { label: "User avatar", value: "{user.avatar}" },
        ],
        messageOptions: { silent: false, ephemeral: false },
        disabledComponentTypes: [ComponentType.Container, ComponentType.File],
    }}
/>
```

- `buttonPresets`: host-provided buttons with a `label`, `customId`, optional `style`, `emoji`, and `disabled` state. Styles are limited to Primary, Secondary, Success, and Danger.
- `placeholders`: text substitutions identified by a `key`, with a `label` and optional `description` and `example`.
- `attachmentPlaceholders`: host-provided media/file values with a `label`, literal `value`, and optional `description`. Values such as `{guild.icon}` stay unchanged in the draft; your app resolves them.
- `messageOptions`: controls visibility of the silent/ephemeral toggles. `false` hides a toggle; set its initial value separately in `prefill.flags`.
- `disabledComponentTypes`: hides selected add-component controls. Supports TextDisplay, MediaGallery, File, Container, Separator, and ActionRow.

`prefill` accepts partial draft fields: `items`, `attachments`, and `flags`. `state` is an optional correlation string echoed in events. Changing session inputs starts a new session; remount the component to explicitly start over.

## Events and lifecycle

Every event has `type: "messagekit:composer"`, an `event` name, `composerSessionId`, and optional `state` and `diagnostics`.

| Event | Callback | Additional data |
| --- | --- | --- |
| `ready` | `onReady` | Composer is ready to use |
| `change` | `onChange` | `draft` |
| `resize` | `onEvent` | `height` |
| `saved` | `onSaved` | `draft` |
| `cancelled` | `onCancelled` | — |
| `expired` | `onExpired` | — |
| `error` | `onError` | `error` |

`onEvent` receives all accepted events, including those with a dedicated callback. `useComposerEvents` checks the iframe origin, session ID, and correlation state before delivering an event.

`ComposerIframe` renders nothing while the session is loading or if session creation fails. `onError` receives an `Error` for session creation failures and readiness timeouts, or a `ComposerEvent` for errors reported by the composer.

The default readiness timeout is **20 seconds**, measured from the start of an attempt. Set `readyTimeoutMs={0}` to disable it. A timeout reports an error but does not remove the iframe. Show your own retry UI and remount the component for a fresh attempt. An iframe `load` event is not a composer `ready` event.

## Custom iframes and standalone links

Create a session without rendering the React component:

```ts
import { createComposerSession } from "mksdk"

const session = await createComposerSession({
    parentOrigin: "https://your-app.example.com",
    state: "announcement-123",
    options: { title: "Compose announcement" },
})

// Render session.iframeUrl in an iframe, or open it as a standalone link.
console.info(session.iframeUrl)
```

`parentOrigin` defaults to `window.location.origin` in a browser. Supply it explicitly on the server. `apiBaseUrl` overrides the MessageKit service URL, and `signal` accepts an `AbortSignal` for session creation.

For React integrations with custom rendering, use the session and event hooks:

```tsx
import { useComposerEvents, useComposerSession, type MessageKitDraft } from "mksdk"

export function CustomComposer({
    onSave,
}: {
    onSave: (draft: MessageKitDraft) => void
}) {
    const { session, loading, error } = useComposerSession({ state: "announcement-123" })

    useComposerEvents(session, (event) => {
        if (event.event === "saved" && event.draft) onSave(event.draft)
    })

    if (loading) return <p>Loading composer…</p>
    if (error || !session) return <p>Could not load the composer.</p>

    return <iframe src={session.iframeUrl} title="Message composer" style={{ width: "100%", height: 720, border: 0 }} />
}
```

### Webhook completions

For standalone links, pass `webhookUrl` to `createComposerSession`. MessageKit sends a JSON `POST` before completing a save or cancellation. A non-2xx response fails the operation so the user can retry.

```ts
const session = await createComposerSession({
    parentOrigin: "https://your-app.example.com",
    state: "announcement-123",
    webhookUrl: "https://your-app.example.com/webhooks/messagekit",
})
```

The body uses the same event shape as iframe messages:

```json
{
    "type": "messagekit:composer",
    "event": "saved",
    "composerSessionId": "session-id",
    "state": "announcement-123",
    "draft": {
        "items": [],
        "attachments": [],
        "flags": { "silent": false, "ephemeral": false }
    }
}
```

Cancellation events omit `draft`. Requests include `X-MessageKit-Event` and `X-MessageKit-Composer-Session-Id` headers. These headers identify the event; they are not authentication signatures. Authenticate your webhook endpoint, correlate expected sessions, and handle retries idempotently.

## Uploaded attachments

Drafts contain:

```ts
import type { MessageKitDraft } from "mksdk"

// MessageKitDraft:
// {
//     items: MessageKitComponent[]
//     flags: { silent: boolean; ephemeral: boolean }
//     attachments?: MessageKitAttachment[]
// }
```

Real uploaded files remain referenced in `items` as `attachment://name.ext`. On save, `draft.attachments` supplies each file's `attachment` reference, temporary `url`, `filename`, and optional `contentType`, `size`, and `expiresAt`.

**Copy uploads to storage you control before persisting a draft.** Temporary MessageKit upload URLs expire after roughly one hour. Replace each `attachment://...` reference with your permanent URL, or re-upload the files to Discord when sending. For File components, use Discord attachment references rather than external URLs.

Placeholder media values are not uploads. Resolve them separately; MessageKit does not upload or substitute them.

## Types and JSON schemas

`ButtonStyle`, `ComponentType`, and the exported `MessageKit*` component types are defined by the SDK. No Discord library is needed to consume or construct a draft. `MessageKitComponent` is a discriminated union of supported top-level message components; nested containers and sections expose their supported child types.

The package also exports session, option, event, attachment, and diagnostics types, including `ComposerIframeProps`, `CreateComposerSessionInput`, `ComposerSession`, `ComposerSessionOptions`, `ComposerEvent`, `ComposerDiagnostics`, `MessageKitDraft`, and `MessageKitAttachment`.

For runtime validation, use the plain JSON Schema-compatible objects with your preferred validator:

```ts
import {
    composerEventSchema,
    messageKitAttachmentSchema,
    messageKitDraftSchema,
} from "mksdk"

// Example: ajv.compile(composerEventSchema)
```

The draft schema checks the envelope, flags, and attachment metadata; it does not deeply validate Discord component payloads. `isComposerEvent` is a lightweight envelope guard, not a full schema validator or an origin/session check.

## Diagnostics

`createComposerSession` returns optional `session.diagnostics` and throws `ComposerSessionError` on failure. Inspect `error.diagnostics` for a request ID, UTC start time, duration, HTTP status, response category, and bounded error code.

`ComposerIframe` accepts `onDiagnostic`, called after session creation and on iframe load. Composer event callbacks can also include diagnostics.

```tsx
<ComposerIframe
    style={{ height: 720 }}
    onDiagnostic={(diagnostic) => {
        console.info(diagnostic.stage, diagnostic.request_id, diagnostic.duration_ms)
    }}
/>
```

Diagnostics intentionally exclude downstream response bodies and transport error messages. Avoid logging entire events or session inputs: they may contain message drafts, webhook URLs, and caller state.

## Development

```bash
bun install
bun run typecheck
bun run build
```

`bun run build` emits JavaScript and declarations to `dist`. Packing the package runs the build automatically. This repository contains the SDK, not the MessageKit service.

## License

[MIT](./LICENSE) © Buape Studios, LLC.
