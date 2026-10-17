import type {
	ComposerDiagnostics,
	ComposerEvent,
	ComposerSession,
	CreateComposerSessionInput,
} from "./schema.js"
import { COMPOSER_EVENT_TYPE } from "./schema.js"

export * from "./components.js"
export * from "./schema.js"

export const MESSAGEKIT_DEFAULT_API_BASE_URL = "https://www.messagekit.app"

export class ComposerSessionError extends Error {
	constructor(public readonly diagnostics: ComposerDiagnostics) {
		super("Failed to create composer session")
		this.name = "ComposerSessionError"
	}
}

export async function createComposerSession({
	apiBaseUrl = MESSAGEKIT_DEFAULT_API_BASE_URL,
	parentOrigin = typeof window === "undefined" ? undefined : window.location.origin,
	webhookUrl,
	state,
	prefill,
	options,
	signal,
}: CreateComposerSessionInput): Promise<ComposerSession> {
	const startedAt = Date.now()
	const clientRequestId = crypto.randomUUID()
	const diagnostics: ComposerDiagnostics = {
		stage: "session",
		client_request_id: clientRequestId,
		request_started_at: new Date(startedAt).toISOString(),
		duration_ms: 0,
	}
	let response: Response
	try {
		response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/composer-sessions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({
				parentOrigin,
				webhookUrl,
				state,
				prefill,
				options,
				diagnosticId: clientRequestId,
			}),
			signal,
		})
	} catch {
		diagnostics.duration_ms = Date.now() - startedAt
		diagnostics.error_type = signal?.aborted ? "aborted" : "network"
		throw new ComposerSessionError(diagnostics)
	}

	diagnostics.http_status = response.status
	const requestId = response.headers.get("X-MessageKit-Request-Id")
	if (requestId && /^[0-9a-f-]{36}$/i.test(requestId)) diagnostics.request_id = requestId
	diagnostics.response_type = response.headers.get("Content-Type")?.includes("application/json")
		? "json"
		: "other"
	let result: { data?: ComposerSession | null } | null = null
	try {
		result = await response.json()
	} catch {
		// Do not retain non-JSON error pages or transport/parser messages.
	}

	diagnostics.duration_ms = Date.now() - startedAt
	if (
		!response.ok ||
		!result?.data ||
		typeof result.data.composerSessionId !== "string" ||
		typeof result.data.iframeUrl !== "string"
	) {
		diagnostics.error_type = response.ok ? "invalid_response" : "http"
		throw new ComposerSessionError(diagnostics)
	}
	return { ...result.data, diagnostics }
}

export function isComposerEvent(value: unknown): value is ComposerEvent {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as ComposerEvent).type === COMPOSER_EVENT_TYPE &&
		typeof (value as ComposerEvent).event === "string" &&
		typeof (value as ComposerEvent).composerSessionId === "string"
	)
}

export function subscribeToComposerEvents(
	session: ComposerSession,
	handler: (event: ComposerEvent) => void,
) {
	const iframeOrigin = new URL(session.iframeUrl).origin
	const listener = (event: MessageEvent) => {
		if (event.origin !== iframeOrigin) return
		if (!isComposerEvent(event.data)) return
		if (event.data.composerSessionId !== session.composerSessionId) return
		if ((event.data.state ?? null) !== (session.state ?? null)) return
		handler(event.data)
	}

	window.addEventListener("message", listener)
	return () => window.removeEventListener("message", listener)
}
