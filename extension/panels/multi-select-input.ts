import type {
  Disposable,
  ExtensionContext,
  QuickInput,
  QuickInputButton,
  QuickPickItem,
} from 'vscode'
import type { ColorMode } from '~/types'
import { Octokit } from '@octokit/core'
import {
  ConfigurationTarget,
  l10n,
  ProgressLocation,
  QuickInputButtons,
  window,
  workspace,
} from 'vscode'

import { APIS, EXTENSION_NAME } from '@/constants'
import { getSettings, invalidateSettingsCache } from '@/utils'
import { COLOR_MODE } from '~/types'

interface State {
  title: string
  step: number
  totalSteps: number
  token: string
  user: string
  repo: string
  branch: string
  'color-mode': ColorMode
}

interface PartialState extends Partial<State> {}

type InputValidator = (value: string) => string | undefined | Promise<string | undefined>

interface ShowInputBoxParams {
  title: string
  step: number
  totalSteps: number
  value: string
  prompt: string
  validate: InputValidator
  buttons?: QuickInputButton[]
  shouldResume?: () => Promise<boolean>
}

interface ShowQuickPickParams<T extends QuickPickItem> {
  title: string
  step: number
  totalSteps: number
  items: T[]
  activeItem?: T
  placeholder: string
  buttons?: QuickInputButton[]
  shouldResume?: () => Promise<boolean>
}

interface ColorModeItem extends QuickPickItem {
  value: ColorMode
}

const TOTAL_STEPS = 5

const COLOR_MODE_ITEMS: ColorModeItem[] = [
  {
    label: 'System',
    detail: 'Follow the current Editor color mode',
    value: COLOR_MODE.SYSTEM,
  },
  {
    label: 'Light',
    detail: 'Always use light mode',
    value: COLOR_MODE.LIGHT,
  },
  {
    label: 'Dark',
    detail: 'Always use dark mode',
    value: COLOR_MODE.DARK,
  },
]

export default async function multiStepInput(_context: ExtensionContext) {
  async function collectInputs() {
    const state: PartialState = await getSettings()
    await MultiStepInput.run(async input => inputUser(input, state))
    return state
  }

  const title = l10n.t('GitHub Blogger Initialization')

  async function inputUser(input: MultiStepInput, state: PartialState) {
    state.user = await input.showInputBox({
      title,
      step: 1,
      totalSteps: TOTAL_STEPS,
      value: state.user || '',
      prompt: l10n.t('Enter your GitHub username'),
      validate: validateRequired,
      shouldResume,
    })
    return async (nextInput: MultiStepInput) => inputToken(nextInput, state)
  }

  async function inputToken(input: MultiStepInput, state: PartialState) {
    state.token = await input.showInputBox({
      title,
      step: 2,
      totalSteps: TOTAL_STEPS,
      value: state.token || '',
      prompt: l10n.t('Enter your GitHub Personal Access Token (classic)'),
      validate: validateRequired,
      shouldResume,
    })
    return async (nextInput: MultiStepInput) => inputRepoForIssue(nextInput, state)
  }

  async function inputRepoForIssue(input: MultiStepInput, state: PartialState) {
    state.repo = await input.showInputBox({
      title,
      step: 3,
      totalSteps: TOTAL_STEPS,
      value: state.repo || '',
      prompt: l10n.t(
        'Enter your blog repository name. It will be created automatically if it does not exist.'
      ),
      validate: validateRequired,
      shouldResume,
    })
    return async (nextInput: MultiStepInput) => inputBranch(nextInput, state)
  }

  async function inputBranch(input: MultiStepInput, state: PartialState) {
    state.branch = await input.showInputBox({
      title,
      step: 4,
      totalSteps: TOTAL_STEPS,
      value: state.branch || '',
      prompt: l10n.t(
        'Enter your blog repository branch name. Used for post/image storage, usually the default branch'
      ),
      validate: validateRequired,
      shouldResume,
    })

    return async (nextInput: MultiStepInput) => inputColorMode(nextInput, state)
  }

  async function inputColorMode(input: MultiStepInput, state: PartialState) {
    const currentColorMode = state['color-mode'] ?? COLOR_MODE.LIGHT
    const activeItem =
      COLOR_MODE_ITEMS.find(item => item.value === currentColorMode) ?? COLOR_MODE_ITEMS[0]

    const selectedItem = await input.showQuickPick({
      title,
      step: 5,
      totalSteps: TOTAL_STEPS,
      items: COLOR_MODE_ITEMS,
      activeItem,
      placeholder: l10n.t('Select your preferred color mode'),
      shouldResume,
    })

    state['color-mode'] = selectedItem.value
  }

  async function shouldResume() {
    return Promise.resolve(false)
  }

  async function validateRequired(name: string) {
    return !name ? l10n.t('Cannot be empty') : undefined
  }

  const state: PartialState = await collectInputs()
  const token = state.token ?? ''
  const user = state.user ?? ''
  const branch = state.branch ?? ''
  const repo = state.repo ?? ''
  const colorMode = state['color-mode'] ?? COLOR_MODE.LIGHT

  await workspace
    .getConfiguration(EXTENSION_NAME)
    .update('token', token, ConfigurationTarget.Global)

  await workspace.getConfiguration(EXTENSION_NAME).update('user', user, ConfigurationTarget.Global)

  await workspace
    .getConfiguration(EXTENSION_NAME)
    .update('branch', branch, ConfigurationTarget.Global)

  await workspace.getConfiguration(EXTENSION_NAME).update('repo', repo, ConfigurationTarget.Global)
  await workspace
    .getConfiguration(EXTENSION_NAME)
    .update('color-mode', colorMode, ConfigurationTarget.Global)
  invalidateSettingsCache()

  const octokit = new Octokit({ auth: token })

  window.withProgress(
    {
      location: ProgressLocation.Window,
      cancellable: false,
      title: l10n.t('Initializing GitHub Blogger'),
    },
    async progress => {
      progress.report({ increment: 0 })

      const repoName = repo

      try {
        await octokit.request(APIS.CREATE_REPO, { name: repoName })
        window.showInformationMessage(
          l10n.t(
            'GitHub Blogger initialization completed. Repository "{0}" has been created. You can now run "Open GitHub Blogger" from the command palette to start writing your blog.',
            repoName
          )
        )
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : l10n.t('Unknown error')

        if (errorMsg.includes('already exists')) {
          window.showInformationMessage(
            l10n.t(
              'GitHub Blogger initialization completed. You can now run "Open GitHub Blogger" from the command palette to start writing your blog.'
            )
          )
          return
        }

        window.showErrorMessage(
          l10n.t(
            'GitHub Blogger initialization failed. Please check your configuration.\n{0}',
            errorMsg
          )
        )
      }
      progress.report({ increment: 100 })
    }
  )
}

class InputFlowAction {
  static back = new InputFlowAction()
  static cancel = new InputFlowAction()
  static resume = new InputFlowAction()
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>

class MultiStepInput {
  static async run(start: InputStep) {
    const input = new MultiStepInput()
    return input.stepThrough(start)
  }

  private current?: QuickInput

  private steps: InputStep[] = []

  async stepThrough(start: InputStep) {
    let step: InputStep | void = start
    while (step) {
      this.steps.push(step)
      if (this.current) {
        this.current.enabled = false
        this.current.busy = true
      }
      try {
        step = await step(this)
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop()
          step = this.steps.pop()
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop()
        } else if (err === InputFlowAction.cancel) {
          step = undefined
        } else {
          throw err
        }
      }
    }
    if (this.current) {
      this.current.dispose()
    }
  }

  async showInputBox({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    buttons,
    shouldResume,
  }: ShowInputBoxParams) {
    const disposables: Disposable[] = []
    try {
      return await new Promise<string>((resolve, reject) => {
        const input = window.createInputBox()
        input.title = title
        input.step = step
        input.totalSteps = totalSteps
        input.value = value || ''
        input.prompt = prompt
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ]
        let validating = validate('')
        disposables.push(
          input.onDidTriggerButton(item => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back)
            } else {
              resolve(input.value)
            }
          }),
          input.onDidAccept(async () => {
            const { value } = input
            input.enabled = false
            input.busy = true
            if (!(await validate(value))) {
              resolve(value)
            }
            input.enabled = true
            input.busy = false
          }),
          input.onDidChangeValue(async text => {
            const current = validate(text)
            validating = current
            const validationMessage = await current
            if (current === validating) {
              input.validationMessage = validationMessage
            }
          }),
          input.onDidHide(() => {
            ;(async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              )
            })().catch(reject)
          })
        )
        if (this.current) {
          this.current.dispose()
        }
        this.current = input
        this.current.show()
      })
    } finally {
      disposables.forEach(disposable => {
        disposable.dispose()
      })
    }
  }

  async showQuickPick<T extends QuickPickItem>({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    placeholder,
    buttons,
    shouldResume,
  }: ShowQuickPickParams<T>) {
    const disposables: Disposable[] = []
    try {
      return await new Promise<T>((resolve, reject) => {
        const input = window.createQuickPick<T>()
        input.title = title
        input.step = step
        input.totalSteps = totalSteps
        input.placeholder = placeholder
        input.items = items
        input.activeItems = activeItem ? [activeItem] : []
        input.selectedItems = activeItem ? [activeItem] : []
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ]

        disposables.push(
          input.onDidTriggerButton(item => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back)
            }
          }),
          input.onDidAccept(() => {
            const [selectedItem] = input.selectedItems
            if (selectedItem) {
              resolve(selectedItem)
            }
          }),
          input.onDidHide(() => {
            ;(async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              )
            })().catch(reject)
          })
        )
        if (this.current) {
          this.current.dispose()
        }
        this.current = input
        this.current.show()
      })
    } finally {
      disposables.forEach(disposable => {
        disposable.dispose()
      })
    }
  }
}
