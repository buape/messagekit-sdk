"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ComposerSessionError, createComposerSession, subscribeToComposerEvents } from "./index.js"
import type {
	ComposerDiagnostics,
	ComposerEvent,
	ComposerSession,
	CreateComposerSessionInput,
} from "./schema.js"
export type ComposerIframeProps = Omit<CreateComposerSessionInput, "signal"> & {
	className?: string
	style?: React.CSSProperties
	title?: string
	readyTimeoutMs?: number
	onDiagnostic?: (diagnostic: ComposerDiagnostics) => void
	onEvent?: (event: ComposerEvent) => void
	onReady?: (event: ComposerEvent) => void
	onChange?: (event: ComposerEvent) => void
	onSaved?: (event: ComposerEvent) => void
	onCancelled?: (event: ComposerEvent) => void
	onExpired?: (event: ComposerEvent) => void
	onError?: (event: ComposerEvent | Error) => void
}

export function useComposerSession(input: CreateComposerSessionInput) {
	const [session, setSession] = useState<ComposerSession | null>(null)
	const [error, setError] = useState<Error | null>(null)
	const [loading, setLoading] = useState(true)
	const stableInput = useMemo(() => JSON.stringify(input), [input])

	useEffect(() => {
		const controller = new AbortController()
		const sessionInput = JSON.parse(stableInput) as CreateComposerSessionInput
		setLoading(true)
		setError(null)
		createComposerSession({ ...sessionInput, signal: controller.signal })
			.then(setSession)
			.catch((caught) => {
				if (!controller.signal.aborted) {
					setError(caught instanceof Error ? caught : new Error("Unknown error"))
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false)
			})
		return () => controller.abort()
	}, [stableInput])

	return { session, error, loading }
}

export function useComposerEvents(
	session: ComposerSession | null,
	handler?: (event: ComposerEvent) => void,
) {
	useEffect(() => {
		if (!session || !handler) return

		return subscribeToComposerEvents(session, handler)
	}, [handler, session])
}

export function ComposerIframe({
	className,
	style,
	title = "MessageKit composer",
	readyTimeoutMs = 20_000,
	onDiagnostic,
	onEvent,
	onReady,
	onChange,
	onSaved,
	onCancelled,
	onExpired,
	onError,
	...input
}: ComposerIframeProps) {
	const { session, error, loading } = useComposerSession(input)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const mountedAt = useRef(Date.now())
	const inputKey = JSON.stringify(input)
	// biome-ignore lint/correctness/useExhaustiveDependencies: changed inputs start a fresh composer attempt/deadline.
	useEffect(() => {
		mountedAt.current = Date.now()
	}, [inputKey])
	const [readySessionId, setReadySessionId] = useState<string | null>(null)
	const ready = !!session && readySessionId === session.composerSessionId
	const onErrorRef = useRef(onError)
	onErrorRef.current = onError
	const onDiagnosticRef = useRef(onDiagnostic)
	onDiagnosticRef.current = onDiagnostic

	useEffect(() => {
		if (session?.diagnostics) onDiagnosticRef.current?.(session.diagnostics)
	}, [session])

	const handleEvent = useCallback(
		(received: ComposerEvent) => {
			const event = { ...received, diagnostics: received.diagnostics ?? session?.diagnostics }
			onEvent?.(event)
			if (event.event === "ready") {
				setReadySessionId(event.composerSessionId)
				onReady?.(event)
			}
			if (event.event === "change") onChange?.(event)
			if (event.event === "saved") onSaved?.(event)
			if (event.event === "cancelled") onCancelled?.(event)
			if (event.event === "expired") onExpired?.(event)
			if (event.event === "error") onError?.(event)
		},
		[onCancelled, onChange, onError, onEvent, onExpired, onReady, onSaved, session],
	)

	useComposerEvents(session, handleEvent)

	useEffect(() => {
		if (error) onErrorRef.current?.(error)
	}, [error])

	// biome-ignore lint/correctness/useExhaustiveDependencies: input changes must restart the timer even before the replacement session arrives.
	useEffect(() => {
		if (ready || error || !readyTimeoutMs) return
		const timeout = setTimeout(
			() => {
				onErrorRef.current?.(
					new ComposerSessionError({
						...session?.diagnostics,
						stage: "ready",
						request_started_at:
							session?.diagnostics?.request_started_at ??
							new Date(mountedAt.current).toISOString(),
						duration_ms: Date.now() - mountedAt.current,
						error_type: "ready_timeout",
					}),
				)
			},
			Math.max(0, readyTimeoutMs - (Date.now() - mountedAt.current)),
		)
		return () => clearTimeout(timeout)
	}, [ready, error, readyTimeoutMs, session, inputKey])

	if (loading) return null
	if (error || !session) return null

	return (
		<iframe
			ref={iframeRef}
			src={session.iframeUrl}
			title={title}
			onLoad={() => {
				if (!session.diagnostics) return
				onDiagnosticRef.current?.({
					...session.diagnostics,
					stage: "iframe_load",
					duration_ms: Date.now() - Date.parse(session.diagnostics.request_started_at),
				})
			}}
			className={className}
			style={{ width: "100%", height: "100%", border: 0, ...style }}
			allow="clipboard-write"
		/>
	)
}
