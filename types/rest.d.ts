import type { Endpoints } from '@octokit/types'
import { APIS } from '@/constants'

export {}

declare global {
  type APIMap = typeof APIS

  type APIUrl = APIMap[keyof APIMap]

  type RestApiType<
    T extends APIUrl,
    K extends keyof Endpoints[keyof Endpoints],
  > = T extends keyof Endpoints ? Endpoints[T][K] : never

  type RestApiResponseType<T extends APIUrl> = RestApiType<T, 'response'>

  type RestApiParametersType<T extends APIUrl> = RestApiType<T, 'parameters'>

  type RestApiResponse<T extends APIUrl> = Promise<RestApiResponseType<T>>

  type RestApiData<T extends APIUrl> = RestApiResponseType<T>['data']

  type RestApiDataItem<T> = T extends Array<infer U> ? U : never

  type RestRepo = RestApiData<typeof APIS.GET_REPO>

  type RestLabels = RestApiData<typeof APIS.GET_LABELS>

  type RestLabel = RestApiDataItem<RestLabels>

  type RestIssues = RestApiData<typeof APIS.GET_ISSUES>

  type RestIssue = RestApiDataItem<RestIssues>

  type RestRef = RestApiData<typeof APIS.GET_REF>

  type RestCommit = RestApiData<typeof APIS.GET_COMMIT>

  type RestBlob = RestApiData<typeof APIS.CREATE_BLOB>

  type RestTree = RestApiData<typeof APIS.CREATE_TREE>

  type GetRefParams = Omit<RestApiParametersType<typeof APIS.GET_REF>, 'owner' | 'repo' | 'ref'>

  type GetCommitParams = Omit<RestApiParametersType<typeof APIS.GET_COMMIT>, 'owner' | 'repo'>

  type CreateCommitParams = Omit<RestApiParametersType<typeof APIS.CREATE_COMMIT>, 'owner' | 'repo'>

  type CreateBlobParams = Omit<RestApiParametersType<typeof APIS.CREATE_BLOB>, 'owner' | 'repo'>

  type CreateTreeParams = Omit<RestApiParametersType<typeof APIS.CREATE_TREE>, 'owner' | 'repo'>

  type UpdateRefParams = Omit<
    RestApiParametersType<typeof APIS.UPDATE_REF>,
    'owner' | 'repo' | 'ref'
  >

  type GetIssuesParams = Omit<RestApiParametersType<typeof APIS.GET_ISSUES>, 'owner' | 'repo'>

  type CreateIssueParams = Omit<RestApiParametersType<typeof APIS.CREATE_ISSUE>, 'owner' | 'repo'>

  type UpdateIssueParams = Omit<RestApiParametersType<typeof APIS.UPDATE_ISSUE>, 'owner' | 'repo'>

  type CreateLabelParams = Omit<RestApiParametersType<typeof APIS.CREATE_LABEL>, 'owner' | 'repo'>

  type UpdateLabelParams = Omit<RestApiParametersType<typeof APIS.UPDATE_LABEL>, 'owner' | 'repo'>

  type DeleteLabelParams = Omit<RestApiParametersType<typeof APIS.DELETE_LABEL>, 'owner' | 'repo'>
}
