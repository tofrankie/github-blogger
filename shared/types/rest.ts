import type { Endpoints } from '@octokit/types'
import type { ArrayElement } from './base'

export type RestEndpoint = keyof Endpoints

export type RestApiType<T extends RestEndpoint, K extends keyof Endpoints[T]> = Endpoints[T][K]

export type RestApiResponseType<T extends RestEndpoint> = RestApiType<T, 'response'>

export type RestApiParametersType<T extends RestEndpoint> = RestApiType<T, 'parameters'>

export type RestApiResponse<T extends RestEndpoint> = Promise<RestApiResponseType<T>>

export type RestApiData<T extends RestEndpoint> = RestApiResponseType<T>['data']

export type RestApiDataItem<T extends readonly unknown[]> = ArrayElement<T>

export type GetRepoEndpoint = 'GET /repos/{owner}/{repo}'
export type GetLabelsEndpoint = 'GET /repos/{owner}/{repo}/labels'
export type GetIssuesEndpoint = 'GET /repos/{owner}/{repo}/issues'
export type GetRefEndpoint = 'GET /repos/{owner}/{repo}/git/ref/{ref}'
export type GetCommitEndpoint = 'GET /repos/{owner}/{repo}/git/commits/{commit_sha}'
export type CreateBlobEndpoint = 'POST /repos/{owner}/{repo}/git/blobs'
export type CreateTreeEndpoint = 'POST /repos/{owner}/{repo}/git/trees'

export type CreateIssueEndpoint = 'POST /repos/{owner}/{repo}/issues'
export type UpdateIssueEndpoint = 'PATCH /repos/{owner}/{repo}/issues/{issue_number}'

export type CreateLabelEndpoint = 'POST /repos/{owner}/{repo}/labels'
export type UpdateLabelEndpoint = 'PATCH /repos/{owner}/{repo}/labels/{name}'
export type DeleteLabelEndpoint = 'DELETE /repos/{owner}/{repo}/labels/{name}'

export type CreateCommitEndpoint = 'POST /repos/{owner}/{repo}/git/commits'
export type UpdateRefEndpoint = 'PATCH /repos/{owner}/{repo}/git/refs/{ref}'

export type RestRepo = RestApiData<GetRepoEndpoint>
export type RestLabels = RestApiData<GetLabelsEndpoint>
export type RestLabel = RestApiDataItem<RestLabels>

export type RestIssues = RestApiData<GetIssuesEndpoint>
export type RestIssue = RestApiDataItem<RestIssues>

export type RestRef = RestApiData<GetRefEndpoint>
export type RestCommit = RestApiData<GetCommitEndpoint>
export type RestBlob = RestApiData<CreateBlobEndpoint>
export type RestTree = RestApiData<CreateTreeEndpoint>

export type GetRefParams = Omit<RestApiParametersType<GetRefEndpoint>, 'owner' | 'repo' | 'ref'>

export type GetCommitParams = Omit<RestApiParametersType<GetCommitEndpoint>, 'owner' | 'repo'>

export type CreateCommitParams = Omit<RestApiParametersType<CreateCommitEndpoint>, 'owner' | 'repo'>

export type CreateBlobParams = Omit<RestApiParametersType<CreateBlobEndpoint>, 'owner' | 'repo'>

export type CreateTreeParams = Omit<RestApiParametersType<CreateTreeEndpoint>, 'owner' | 'repo'>

export type UpdateRefParams = Omit<
  RestApiParametersType<UpdateRefEndpoint>,
  'owner' | 'repo' | 'ref'
>

export type GetIssuesParams = Omit<RestApiParametersType<GetIssuesEndpoint>, 'owner' | 'repo'>

export type CreateIssueParams = Omit<RestApiParametersType<CreateIssueEndpoint>, 'owner' | 'repo'>

export type UpdateIssueParams = Omit<RestApiParametersType<UpdateIssueEndpoint>, 'owner' | 'repo'>

export type CreateLabelParams = Omit<RestApiParametersType<CreateLabelEndpoint>, 'owner' | 'repo'>

export type UpdateLabelParams = Omit<RestApiParametersType<UpdateLabelEndpoint>, 'owner' | 'repo'>

export type DeleteLabelParams = Omit<RestApiParametersType<DeleteLabelEndpoint>, 'owner' | 'repo'>
