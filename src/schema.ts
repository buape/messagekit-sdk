import type {
	ButtonStyle,
	ComponentType,
	MessageKitComponent,
	MessageKitEmoji,
} from "./components.js"

export const COMPOSER_EVENT_TYPE = "messagekit:composer"

export type MessageKitAttachment = {
	attachment: string
	url: string
	filename: string
	contentType?: string
	size?: number
	expiresAt?: number
}

export type MessageKitDraft = {
	items: MessageKitComponent[]
	attachments?: MessageKitAttachment[]
	flags: {
		silent: boolean
		ephemeral: boolean
	}
}

export type ComposerButtonPreset = {
	label: string
	customId: string
	style?: ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger
	emoji?: MessageKitEmoji
	disabled?: boolean
}

export type ComposerAttachmentPlaceholder = {
	label: string
	value: string
	description?: string
}

export type MessagePlaceholder = {
	key: string
	label: string
	description?: string
	example?: string
}

export type ComposerMessageOptionControls = {
	silent?: boolean
	ephemeral?: boolean
}

export type ComposerDisabledComponentType =
	| ComponentType.TextDisplay
	| ComponentType.MediaGallery
	| ComponentType.File
	| ComponentType.Container
	| ComponentType.Separator
	| ComponentType.ActionRow

export type ComposerSessionOptions = {
	title?: string
	allowCancel?: boolean
	buttonPresets?: ComposerButtonPreset[]
	attachmentPlaceholders?: ComposerAttachmentPlaceholder[]
	messageOptions?: ComposerMessageOptionControls
	disabledComponentTypes?: ComposerDisabledComponentType[]
	placeholders?: MessagePlaceholder[]
}

export type CreateComposerSessionInput = {
	apiBaseUrl?: string
	parentOrigin?: string
	webhookUrl?: string
	state?: string | null
	prefill?: Partial<MessageKitDraft>
	options?: ComposerSessionOptions
	signal?: AbortSignal
}

export type ComposerDiagnostics = {
	stage: "session" | "save" | "cancel" | "iframe_load" | "ready"
	client_request_id?: string
	request_id?: string
	request_started_at: string
	duration_ms: number
	http_status?: number
	response_type?: "json" | "other"
	error_type?: "network" | "aborted" | "http" | "invalid_response" | "ready_timeout"
}

export type ComposerSession = {
	diagnostics?: ComposerDiagnostics
	id: string
	composerSessionId: string
	iframeUrl: string
	expiresAt: number
	parentOrigin: string
	state: string | null
}

export type ComposerEventName =
	| "ready"
	| "resize"
	| "change"
	| "saved"
	| "cancelled"
	| "expired"
	| "error"

export type ComposerEvent = {
	diagnostics?: ComposerDiagnostics
	type: typeof COMPOSER_EVENT_TYPE
	event: ComposerEventName
	composerSessionId: string
	state?: string | null
	draft?: MessageKitDraft
	height?: number
	error?: string
}

export const messageKitAttachmentSchema = {
	type: "object",
	required: ["attachment", "url", "filename"],
	additionalProperties: true,
	properties: {
		attachment: { type: "string" },
		url: { type: "string" },
		filename: { type: "string" },
		contentType: { type: "string" },
		size: { type: "number" },
		expiresAt: { type: "number" },
	},
} as const

export const messageKitDraftSchema = {
	type: "object",
	required: ["items", "flags"],
	additionalProperties: true,
	properties: {
		items: { type: "array", items: { type: "object", additionalProperties: true } },
		attachments: { type: "array", items: messageKitAttachmentSchema },
		flags: {
			type: "object",
			required: ["silent", "ephemeral"],
			additionalProperties: true,
			properties: {
				silent: { type: "boolean" },
				ephemeral: { type: "boolean" },
			},
		},
	},
} as const

export const composerEventSchema = {
	type: "object",
	required: ["type", "event", "composerSessionId"],
	additionalProperties: true,
	properties: {
		type: { const: COMPOSER_EVENT_TYPE },
		event: {
			type: "string",
			enum: ["ready", "resize", "change", "saved", "cancelled", "expired", "error"],
		},
		composerSessionId: { type: "string" },
		state: { type: ["string", "null"] },
		draft: messageKitDraftSchema,
		height: { type: "number" },
		error: { type: "string" },
	},
} as const
