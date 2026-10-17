# @buape/messagekit

Add a Discord Components V2 message builder to your app with [MessageKit](https://www.messagekit.app). Embed the visual editor with plain JavaScript or React so users can build messages without writing JSON. The SDK returns the finished draft for your app to save or send to Discord.

## Install

```bash
pnpm add @buape/messagekit
# or
bun add @buape/messagekit
```

`@buape/messagekit` has no runtime dependencies. React components and hooks are available from `@buape/messagekit/react` and require React 18 or later. The package includes TypeScript declarations and uses ESM.

## JavaScript

Add a `<div id="composer"></div>` to your page:

```js
import { createComposerSession, subscribeToComposerEvents } from "@buape/messagekit"

const session = await createComposerSession({ state: "announcement-123" })
const iframe = document.createElement("iframe")
iframe.title = "Message editor"
iframe.style.cssText = "width: 100%; height: 720px; border: 0"
iframe.allow = "clipboard-write"

const unsubscribe = subscribeToComposerEvents(session, (event) => {
    if (event.event === "saved" && event.draft) {
        // Handle uploaded attachments, then save event.draft in your app.
    }
    if (event.event === "resize" && event.height) {
        iframe.style.height = `${event.height}px`
    }
})

iframe.src = session.iframeUrl
document.getElementById("composer").append(iframe)

// When the editor closes:
// unsubscribe()
// iframe.remove()
```

Subscribe before loading the iframe so you don't miss its `ready` event. Call `unsubscribe()` when you're done. Handle session creation failures with `try`/`catch`; custom iframes need their own loading, timeout, and retry UI.

### Without a bundler

Serve the package's `dist` directory at `/vendor/messagekit/`, then import it from a module script:

```html
<script type="module">
    import {
        createComposerSession,
        subscribeToComposerEvents,
    } from "/vendor/messagekit/index.js"

    // The JavaScript example above works here too.
</script>
```

You must use either use HTTPS or be on localhost. Session creation needs `fetch` and Web Crypto.

## React

Install React if your app doesn't already use it:

```bash
npm install @buape/messagekit react
```

```tsx
"use client"

import { ComponentType, type MessageKitDraft } from "@buape/messagekit"
import { ComposerIframe } from "@buape/messagekit/react"

export function MessageComposer({
    onSave,
}: {
    onSave: (draft: MessageKitDraft) => void
}) {
    return (
        <ComposerIframe
            state="announcement-123"
            style={{ height: 720 }}
            prefill={{
                items: [{ type: ComponentType.TextDisplay, content: "Hello, Discord!" }],
                flags: { silent: false, ephemeral: false },
            }}
            onSaved={(event) => {
                if (event.draft) onSave(event.draft)
            }}
            onError={(error) => {
                console.error(error instanceof Error ? error.message : error.error)
            }}
        />
    )
}
```

Set a height on the component or its parent. `className`, `style`, and `title` apply to the iframe.

For your own iframe component, `useComposerSession(input)` returns `{ session, loading, error }`. Pass that session to `useComposerEvents(session, handler)` to receive events. Both hooks come from `@buape/messagekit/react`.

## Editor options

Pass `options` to `createComposerSession` or `<ComposerIframe>`:

```ts
import { ButtonStyle, ComponentType } from "@buape/messagekit"

const options = {
    title: "Compose announcement",
    allowCancel: true,
    buttonPresets: [
        { label: "Approve", customId: "announcement:approve", style: ButtonStyle.Success },
    ],
    placeholders: [
        { key: "user.name", label: "User name", example: "Alex" },
    ],
    attachmentPlaceholders: [
        { label: "Server icon", value: "{guild.icon}" },
    ],
    messageOptions: { silent: false, ephemeral: false },
    disabledComponentTypes: [ComponentType.Container, ComponentType.File],
}
```

- `buttonPresets` adds buttons supplied by your app. Presets accept Primary, Secondary, Success, or Danger styles, plus optional `emoji` and `disabled` fields.
- `placeholders` lists text placeholders. Each has a `key`, `label`, and optional `description` and `example`.
- `attachmentPlaceholders` lists file or media placeholders. Their values stay unchanged in the draft; your app resolves them.
- `messageOptions` controls which silent/ephemeral toggles are shown. `false` hides a toggle. Set initial values in `prefill.flags`.
- `disabledComponentTypes` hides add-component controls for TextDisplay, MediaGallery, File, Container, Separator, or ActionRow.

## Sessions

| Input          | Purpose                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| `apiBaseUrl`   | Service URL. Defaults to `https://www.messagekit.app`.                           |
| `parentOrigin` | Your app's origin. Defaults to `window.location.origin`; required on the server. |
| `state`        | Optional correlation string returned with events.                                |
| `prefill`      | Initial draft fields: `items`, `attachments`, and `flags`.                       |
| `options`      | Editor controls shown above.                                                     |
| `signal`       | `AbortSignal` for `createComposerSession`.                                       |

Changing session inputs in the React component starts a new session. Remount it to start over with the same inputs.

### Standalone links and webhooks

A session's `iframeUrl` also works as a standalone link. Supply `webhookUrl` to receive saves and cancellations on your server:

```ts
import { createComposerSession } from "@buape/messagekit"

const session = await createComposerSession({
    parentOrigin: "https://your-app.example.com",
    state: "announcement-123",
    webhookUrl: "https://your-app.example.com/webhooks/messagekit",
})
```

MessageKit sends a JSON `POST` with the same event shape used by iframe messages. A `saved` event includes `draft`; `cancelled` omits it. A non-2xx response fails the operation so the user can retry.

Requests include `X-MessageKit-Event` and `X-MessageKit-Composer-Session-Id`. These are not authentication signatures. Protect your endpoint, check the expected session and state, and handle duplicate requests.

## Events

Events include `type: "messagekit:composer"`, `event`, `composerSessionId`, and optional `state` and `diagnostics`.

| Event       | React callback | Data                 |
| ----------- | -------------- | -------------------- |
| `ready`     | `onReady`      | Editor is ready      |
| `change`    | `onChange`     | `draft`              |
| `resize`    | `onEvent`      | `height`             |
| `saved`     | `onSaved`      | `draft`              |
| `cancelled` | `onCancelled`  | No additional fields |
| `expired`   | `onExpired`    | No additional fields |
| `error`     | `onError`      | `error`              |

`onEvent` receives every accepted event. The JavaScript subscription and React hook check the message origin, session ID, and state before calling your handler.

`ComposerIframe` renders nothing while loading or if session creation fails. `onError` receives an `Error` for creation failures and readiness timeouts, or a `ComposerEvent` for errors reported by the editor.

The readiness timeout is 20 seconds from the start of an attempt. Set `readyTimeoutMs={0}` to disable it. A timeout reports an error but leaves the iframe in place. An iframe `load` event does not mean the editor is ready.

## Uploaded attachments

A draft contains `items`, `flags: { silent, ephemeral }`, and optional `attachments`.

Uploaded files appear in `items` as `attachment://name.ext`. On save, `draft.attachments` includes each file's `attachment` reference, temporary `url`, `filename`, and optional `contentType`, `size`, and `expiresAt`.

**Upload URLs expire after roughly one hour.** Copy files to your own storage before saving a draft long-term. Replace attachment references with permanent URLs where supported, or upload the files to Discord when sending. File components require Discord attachment references, not external URLs.

Placeholder values such as `{guild.icon}` are not uploads. Your app must resolve them separately.

## Types and validation

Import types, `ButtonStyle`, and `ComponentType` from `@buape/messagekit`. The SDK defines its own Discord component types, including `MessageKitComponent`, `MessageKitDraft`, and `MessageKitAttachment`. React's `ComposerIframeProps` comes from `@buape/messagekit/react`.

For runtime validation, the core exports `composerEventSchema`, `messageKitDraftSchema`, and `messageKitAttachmentSchema`. Use them with your JSON Schema validator. The draft schema does not validate every Discord component field.

`isComposerEvent` only checks the basic event shape. It does not check the message origin or session.

## Errors and diagnostics

`createComposerSession` throws `ComposerSessionError` on failure. Its `diagnostics` property can include request IDs, start time, duration, HTTP status, response category, and an error code. Successful sessions and composer events can also include diagnostics.

`ComposerIframe` calls `onDiagnostic` after session creation and on iframe load. Log those fields rather than entire events or session inputs, which can contain drafts, webhook URLs, and caller state. Diagnostics do not include response bodies or transport error messages.

## License

[MIT](./LICENSE) © Buape Studios, LLC.
