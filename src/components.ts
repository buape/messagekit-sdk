export enum ComponentType {
	ActionRow = 1,
	Button = 2,
	StringSelect = 3,
	TextInput = 4,
	UserSelect = 5,
	RoleSelect = 6,
	MentionableSelect = 7,
	ChannelSelect = 8,
	Section = 9,
	TextDisplay = 10,
	Thumbnail = 11,
	MediaGallery = 12,
	File = 13,
	Separator = 14,
	ContentInventoryEntry = 16,
	Container = 17,
	Label = 18,
	FileUpload = 19,
	RadioGroup = 21,
	CheckboxGroup = 22,
	Checkbox = 23,
	/** @deprecated Use StringSelect. */
	SelectMenu = 3,
}

export enum ButtonStyle {
	Primary = 1,
	Secondary = 2,
	Success = 3,
	Danger = 4,
	Link = 5,
	Premium = 6,
}

export type MessageKitEmoji = {
	id?: string
	name?: string
	animated?: boolean
}

export type MessageKitMedia = {
	url: string
	proxy_url?: string
	height?: number | null
	width?: number | null
	placeholder?: string
	placeholder_version?: number
	content_type?: string
	flags?: number
	attachment_id?: string
}

export type MessageKitButton = {
	type: ComponentType.Button
	id?: number
	disabled?: boolean
} & (
	| {
			style:
				| ButtonStyle.Primary
				| ButtonStyle.Secondary
				| ButtonStyle.Success
				| ButtonStyle.Danger
			custom_id: string
			label?: string
			emoji?: MessageKitEmoji
			url?: never
			sku_id?: never
	  }
	| {
			style: ButtonStyle.Link
			url: string
			label?: string
			emoji?: MessageKitEmoji
			custom_id?: never
			sku_id?: never
	  }
	| {
			style: ButtonStyle.Premium
			sku_id: string
			custom_id?: never
			url?: never
			label?: never
			emoji?: never
	  }
)

export type MessageKitSelectOption = {
	label: string
	value: string
	description?: string
	emoji?: MessageKitEmoji
	default?: boolean
}

export type MessageKitSelectMenu = {
	id?: number
	custom_id: string
	placeholder?: string
	min_values?: number
	max_values?: number
	disabled?: boolean
} & (
	| {
			type: ComponentType.StringSelect
			options: MessageKitSelectOption[]
	  }
	| {
			type: ComponentType.UserSelect
			default_values?: { id: string; type: "user" }[]
	  }
	| {
			type: ComponentType.RoleSelect
			default_values?: { id: string; type: "role" }[]
	  }
	| {
			type: ComponentType.MentionableSelect
			default_values?: { id: string; type: "user" | "role" }[]
	  }
	| {
			type: ComponentType.ChannelSelect
			channel_types?: number[]
			default_values?: { id: string; type: "channel" }[]
	  }
)

export type MessageKitActionRow = {
	type: ComponentType.ActionRow
	id?: number
	components: (MessageKitButton | MessageKitSelectMenu)[]
}

export type MessageKitTextDisplay = {
	type: ComponentType.TextDisplay
	id?: number
	content: string
}

export type MessageKitThumbnail = {
	type: ComponentType.Thumbnail
	id?: number
	media: MessageKitMedia
	description?: string | null
	spoiler?: boolean
}

export type MessageKitSection = {
	type: ComponentType.Section
	id?: number
	components: MessageKitTextDisplay[]
	accessory: MessageKitButton | MessageKitThumbnail
}

export type MessageKitMediaGallery = {
	type: ComponentType.MediaGallery
	id?: number
	items: {
		media: MessageKitMedia
		description?: string | null
		spoiler?: boolean
	}[]
}

export type MessageKitFile = {
	type: ComponentType.File
	id?: number
	file: MessageKitMedia
	spoiler?: boolean
	name?: string
	size?: number
}

export type MessageKitSeparator = {
	type: ComponentType.Separator
	id?: number
	divider?: boolean
	spacing?: 1 | 2
}

export type MessageKitComponentInContainer =
	| MessageKitActionRow
	| MessageKitTextDisplay
	| MessageKitSection
	| MessageKitMediaGallery
	| MessageKitFile
	| MessageKitSeparator

export type MessageKitContainer = {
	type: ComponentType.Container
	id?: number
	components: MessageKitComponentInContainer[]
	accent_color?: number | null
	spoiler?: boolean
}

export type MessageKitComponent = MessageKitComponentInContainer | MessageKitContainer
