import type { EditorProps } from '@bytemd/react'

export type ClientUploadImages = EditorProps['uploadImages']

export type ClientUploadImagesResult = Awaited<ReturnType<NonNullable<ClientUploadImages>>>
