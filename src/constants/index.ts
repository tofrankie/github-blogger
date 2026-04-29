import type { MinimalIssue } from '~/types'
import { ERROR_TYPE } from '~/constants'

export const VITE_DEV = import.meta.env.DEV

export const SUBMIT_TYPE = {
  CREATE: 'create',
  UPDATE: 'update',
} as const

export const DEFAULT_LABEL_COLOR = 'F5FEE6'

export const PRESET_ISSUE_TYPE_COLORS = ['FFEBE9', 'FFF8C5', 'DDF4FF']

export const PRESET_LABEL_COLORS = [
  'B60205',
  'D93F0B',
  'FBCA04',
  '0E8A16',
  '006B75',
  '1D76DB',
  '0052CC',
  '5319E7',
  'E99695',
  'F9D0C4',
  'FEF2C0',
  'C2E0C6',
  'BFDADC',
  'C5DEF5',
  'BFD4F2',
  'D4C5F9',
]

export const EMPTY_ISSUE: MinimalIssue = {
  id: '',
  number: -1,
  url: '',
  title: '',
  body: '',
  createdAt: '',
  updatedAt: '',
  labels: [],
}

export const ERROR_TYPE_MAP = {
  [ERROR_TYPE.REST]: 'REST Error',
  [ERROR_TYPE.GRAPHQL]: 'GraphQL Error',
  [ERROR_TYPE.UNKNOWN]: 'Unknown Error',
} as const
