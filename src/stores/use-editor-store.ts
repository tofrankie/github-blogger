import {cloneDeep} from 'licia'
import {create} from 'zustand'
import {EMPTY_ISSUE} from '@/constants'

interface EditorStoreState {
  issue: MinimalIssue
  issueSnapshot: MinimalIssue
  isChanged: boolean
  canSubmit: boolean
}

interface EditorStoreActions {
  setIssue: (issue: MinimalIssue) => void
  setTitle: (title: string) => void
  setBody: (body: string) => void
  addLabel: (label: MinimalLabel) => void
  removeLabel: (label: MinimalLabel) => void
  reset: () => void
}

const initialState: EditorStoreState = {
  issue: EMPTY_ISSUE,
  issueSnapshot: EMPTY_ISSUE,
  isChanged: false,
  canSubmit: false,
}

export const useEditorStore = create<EditorStoreState & EditorStoreActions>(set => ({
  ...cloneDeep(initialState),

  setIssue: issue => {
    set({
      issue,
      issueSnapshot: issue,
      isChanged: false,
      canSubmit: calcCanSubmit(issue),
    })
  },

  setTitle: title => {
    set(state => {
      const newIssue = {...state.issue, title}
      return {
        issue: newIssue,
        isChanged: compareIssue(newIssue, state.issueSnapshot),
        canSubmit: calcCanSubmit(newIssue),
      }
    })
  },

  setBody: body => {
    set(state => {
      const newIssue = {...state.issue, body}
      return {
        issue: newIssue,
        isChanged: compareIssue(newIssue, state.issueSnapshot),
        canSubmit: calcCanSubmit(newIssue),
      }
    })
  },

  addLabel: label => {
    set(state => {
      const newIssue = {
        ...state.issue,
        labels: state.issue.labels.concat(label),
      }
      return {
        issue: newIssue,
        isChanged: compareIssue(newIssue, state.issueSnapshot),
      }
    })
  },

  removeLabel: label => {
    set(state => {
      const newIssue = {
        ...state.issue,
        labels: state.issue.labels.filter(item => item.id !== label.id),
      }
      return {
        issue: newIssue,
        isChanged: compareIssue(newIssue, state.issueSnapshot),
      }
    })
  },

  reset: () => {
    set(cloneDeep(initialState))
  },
}))

function calcCanSubmit(issue: MinimalIssue) {
  return !!(issue.title && issue.body)
}

function compareIssue(newIssue: MinimalIssue, oldIssue: MinimalIssue) {
  if (newIssue.title !== oldIssue.title) return true

  if (newIssue.labels.length !== oldIssue.labels.length) return true

  for (const label of newIssue.labels) {
    if (oldIssue.labels.findIndex(({id}) => id === label.id) === -1) return true
  }

  if (newIssue.body.length !== oldIssue.body.length) return true

  if (newIssue.body !== oldIssue.body) return true

  return false
}
