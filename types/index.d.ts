import type { EditorProps } from '@bytemd/react'

export {}

declare global {
  type ValueOf<T> = T[keyof T]

  type ResultTuple<T, E = Error> = [E, null] | [null, T]

  type SettingKey = 'token' | 'user' | 'repo' | 'branch'

  type Settings = {
    [K in SettingKey]: string
  }

  interface MinimalLabel {
    id: string // node id
    name: string
    color: string
    description: string | null
  }

  type MinimalLabels = MinimalLabel[]

  interface MinimalIssue {
    id: string // node id
    number: number
    url: string
    title: string
    body: string
    createdAt: string // An ISO-8601 encoded UTC date string.
    updatedAt: string // An ISO-8601 encoded UTC date string.
    labels: MinimalLabel[]
  }

  type MinimalIssues = MinimalIssue[]

  type ClientUploadImages = EditorProps['uploadImages']

  type ClientUploadImagesResult = Awaited<ReturnType<NonNullable<ClientUploadImages>>>
}
