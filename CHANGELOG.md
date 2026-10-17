# mksdk

## 0.1.0

### Minor Changes

- Public MessageKit composer SDK with React components, hooks, session helpers, typed events, and JSON schemas.
- Node-compatible ESM output, TypeScript declarations, and automatic builds before packing.
- SDK-owned Discord component types and enums with no Discord runtime dependencies.

## 0.0.7

### Patch Changes

- [#32](https://github.com/buape/messagekit/pull/32) [`2cd829a`](https://github.com/buape/messagekit/commit/2cd829a57cde8962b55d25c7e43b1add91bc7d7a) Thanks [@posthog](https://github.com/apps/posthog)! - Call `onError` when the composer iframe does not become ready within `readyTimeoutMs` (default 20 seconds), and report a readable error when the session endpoint returns a non-JSON response.

- [#34](https://github.com/buape/messagekit/pull/34) [`234c2c3`](https://github.com/buape/messagekit/commit/234c2c36bfc9618cb0f8d32776528ee9d6cdab05) Thanks [@kevinatbuape](https://github.com/kevinatbuape)! - Expose safe composer request diagnostics (request IDs, timing, status, response category and failure codes) on errors/events, and report session creation and iframe-load stages through an optional onDiagnostic callback. Never include downstream error bodies or transport messages.

## 0.0.6

### Patch Changes

- [`dca10b3`](https://github.com/buape/messagekit/commit/dca10b3fbd122eb194a27b15a3003e4f6d8057c9) Thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow)! - Add composer session webhook URLs for standalone completion callbacks.

## 0.0.5

### Patch Changes

- [`24f3501`](https://github.com/buape/messagekit/commit/24f3501192727e12c1dea750eb107cad5de5615c) Thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow)! - Add text placeholders to composer session options.

## 0.0.4

### Patch Changes

- [`c051a2c`](https://github.com/buape/messagekit/commit/c051a2cf974863c2a12674ea7191961878bb17a1) Thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow)! - Add exported composer event JSON schemas and update SDK composer defaults/types.

## 0.0.3

### Patch Changes

- [`dc9b5e9`](https://github.com/buape/messagekit/commit/dc9b5e9f35c03292208dcb4edadffb319e5e4d9d) Thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow)! - Add composer attachment placeholders for host-provided file and media values.

## 0.0.2

### Patch Changes

- [`4e25905`](https://github.com/buape/messagekit/commit/4e25905dd929da72bae089cfcde4680b5ecfc0c4) Thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow)! - Add uploaded attachment metadata to composer drafts so SDK consumers can copy temporary MessageKit upload URLs to their own CDN and replace `attachment://` references before saving.

- [`3d45faa`](https://github.com/buape/messagekit/commit/3d45faad17549c7d30e0665659ab2b4c7d3520ac) Thanks [@thewilloftheshadow](https://github.com/thewilloftheshadow)! - Add SDK composer controls for button presets, visible message options, and disabled component types.

## 0.0.1

### Patch Changes

- [#21](https://github.com/buape/messagekit/pull/21) [`0c84dba`](https://github.com/buape/messagekit/commit/0c84dba9f7135543bed7c6372cb752dc08e72424) Thanks [@buapebot](https://github.com/buapebot)! - Add the initial MessageKit iframe composer SDK package.
