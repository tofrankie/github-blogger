export const DEFAULT_PAGINATION_SIZE = 20

export const MESSAGE_TYPE = {
  GET_REPO: 'get_repo',
  GET_ISSUES: 'get_issues',
  GET_ISSUES_WITH_FILTER: 'get_issues_with_filter',
  GET_ISSUE_COUNT: 'get_issue_count',
  GET_ISSUE_COUNT_WITH_FILTER: 'get_issue_count_with_filter',
  CREATE_ISSUE: 'create_issue',
  UPDATE_ISSUE: 'update_issue',
  GET_LABELS: 'get_labels',
  CREATE_LABEL: 'create_label',
  DELETE_LABEL: 'delete_label',
  UPDATE_LABEL: 'update_label',

  GET_REF: 'get_ref',
  UPDATE_REF: 'update_ref',
  CREATE_COMMIT: 'create_commit',
  GET_COMMIT: 'get_commit',
  CREATE_BLOB: 'create_blob',
  CREATE_TREE: 'create_tree',

  GET_SETTINGS: 'get_settings',
  UPLOAD_IMAGE: 'upload_image',
  OPEN_EXTERNAL_LINK: 'open_external_link',
} as const

export const ERROR_TYPE = {
  REST: 'REST',
  GRAPHQL: 'GRAPHQL',
  UNKNOWN: 'UNKNOWN',
} as const
