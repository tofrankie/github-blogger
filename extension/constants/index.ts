import type { Endpoints } from '@octokit/types'

export const EXTENSION_NAME = 'github-blogger'

export const EXTENSION_COMMAND = {
  OPEN: `${EXTENSION_NAME}.open`,
  CONFIGURE: `${EXTENSION_NAME}.configure`,
} as const

export const APIS = {
  /** Get a repository. {@link https://docs.github.com/zh/rest/repos/repos?apiVersion=2022-11-28#get-a-repository|More} */
  GET_REPO: 'GET /repos/{owner}/{repo}',
  /** Creates a new repository for the authenticated user. {@link https://docs.github.com/zh/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user|More} */
  CREATE_REPO: 'POST /user/repos',
  /** Lists all labels for a repository. {@link https://docs.github.com/zh/rest/issues/labels?apiVersion=2022-11-28#list-labels-for-a-repository|More} */
  GET_LABELS: 'GET /repos/{owner}/{repo}/labels',
  /** Creates a label for the specified repository with the given name and color. {@link https://docs.github.com/en/rest/issues/labels#create-a-label|More} */
  CREATE_LABEL: 'POST /repos/{owner}/{repo}/labels',
  /** Delete a label from a repository. {@link https://docs.github.com/en/rest/issues/labels#delete-a-label|More} */
  DELETE_LABEL: 'DELETE /repos/{owner}/{repo}/labels/{name}',
  /** Update a label in a repository. {@link https://docs.github.com/en/rest/issues/labels#update-a-label|More} */
  UPDATE_LABEL: 'PATCH /repos/{owner}/{repo}/labels/{name}',
  /** List repository issues. {@link https://docs.github.com/en/rest/issues/issues#list-repository-issues|More} */
  GET_ISSUES: 'GET /repos/{owner}/{repo}/issues',
  /** Create an issue in a repository. {@link https://docs.github.com/en/rest/issues/issues#create-an-issue|More} */
  CREATE_ISSUE: 'POST /repos/{owner}/{repo}/issues',
  /** Update an issue in a repository. {@link https://docs.github.com/en/rest/issues/issues#update-an-issue|More} */
  UPDATE_ISSUE: 'PATCH /repos/{owner}/{repo}/issues/{issue_number}',
  /** Create or update file contents in a repository. {@link https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents|More} */
  UPLOAD_IMAGE: 'PUT /repos/{owner}/{repo}/contents/{path}',
  /** Get a reference from a repository. {@link https://docs.github.com/en/rest/git/refs#get-a-reference|More} */
  GET_REF: 'GET /repos/{owner}/{repo}/git/ref/{ref}',
  /** Update a reference in a repository. {@link https://docs.github.com/en/rest/git/refs#update-a-reference|More} */
  UPDATE_REF: 'PATCH /repos/{owner}/{repo}/git/refs/{ref}',
  /** Get a commit from a repository. {@link https://docs.github.com/en/rest/git/commits#get-a-commit|More} */
  GET_COMMIT: 'GET /repos/{owner}/{repo}/git/commits/{commit_sha}',
  /** Create a commit in a repository. {@link https://docs.github.com/en/rest/git/commits#create-a-commit|More} */
  CREATE_COMMIT: 'POST /repos/{owner}/{repo}/git/commits',
  /** Create a blob in a repository. {@link https://docs.github.com/en/rest/git/blobs#create-a-blob|More} */
  CREATE_BLOB: 'POST /repos/{owner}/{repo}/git/blobs',
  /** Create a tree in a repository. {@link https://docs.github.com/en/rest/git/trees#create-a-tree|More} */
  CREATE_TREE: 'POST /repos/{owner}/{repo}/git/trees',
} as const satisfies Record<string, keyof Endpoints>
