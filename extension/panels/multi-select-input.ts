import type { Disposable, ExtensionContext, QuickInput, QuickInputButton } from 'vscode'
import { Octokit } from '@octokit/core'
import { ConfigurationTarget, ProgressLocation, QuickInputButtons, window, workspace } from 'vscode'

import { APIS, EXTENSION_NAME } from '@/constants'
import { getSettings, invalidateSettingsCache } from '@/utils'

interface State {
  title: string
  step: number
  totalSteps: number
  token: string
  user: string
  repo: string
  branch: string
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

export default async function multiStepInput(_context: ExtensionContext) {
  async function collectInputs() {
    const state: PartialState = await getSettings()
    await MultiStepInput.run(async input => inputToken(input, state))
    return state
  }

  const title = 'GitHub Blogger Initialization'

  async function inputToken(input: MultiStepInput, state: PartialState) {
    state.token = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 4,
      value: state.token || '',
      prompt: 'Enter your GitHub Personal Access Token (classic)',
      validate: validateRequired,
      shouldResume,
    })
    return async (nextInput: MultiStepInput) => inputUser(nextInput, state)
  }

  async function inputUser(input: MultiStepInput, state: PartialState) {
    state.user = await input.showInputBox({
      title,
      step: 2,
      totalSteps: 4,
      value: state.user || '',
      prompt: 'Enter your GitHub username (owner)',
      validate: validateRequired,
      shouldResume,
    })
    return async (nextInput: MultiStepInput) => inputBranch(nextInput, state)
  }

  async function inputBranch(input: MultiStepInput, state: PartialState) {
    state.branch = await input.showInputBox({
      title,
      step: 3,
      totalSteps: 4,
      value: state.branch || '',
      prompt:
        'Enter your GitHub branch name. Used for image and issue archives, usually the default branch',
      validate: validateRequired,
      shouldResume,
    })
    return async (nextInput: MultiStepInput) => inputRepoForIssue(nextInput, state)
  }

  async function inputRepoForIssue(input: MultiStepInput, state: PartialState) {
    state.repo = await input.showInputBox({
      title,
      step: 4,
      totalSteps: 4,
      value: state.repo || '',
      prompt: 'Enter the repository name. If it already exists, it will not be recreated.',
      validate: validateRequired,
      shouldResume,
    })
  }

  async function shouldResume() {
    return Promise.resolve(false)
  }

  async function validateRequired(name: string) {
    return !name ? 'Cannot be empty' : undefined
  }

  const state: PartialState = await collectInputs()
  const token = state.token ?? ''
  const user = state.user ?? ''
  const branch = state.branch ?? ''
  const repo = state.repo ?? ''

  await workspace
    .getConfiguration(EXTENSION_NAME)
    .update('token', token, ConfigurationTarget.Global)

  await workspace.getConfiguration(EXTENSION_NAME).update('user', user, ConfigurationTarget.Global)

  await workspace
    .getConfiguration(EXTENSION_NAME)
    .update('branch', branch, ConfigurationTarget.Global)

  await workspace.getConfiguration(EXTENSION_NAME).update('repo', repo, ConfigurationTarget.Global)
  invalidateSettingsCache()

  const octokit = new Octokit({ auth: token })

  window.withProgress(
    {
      location: ProgressLocation.Window,
      cancellable: false,
      title: 'Creating the issue blog',
    },
    async progress => {
      progress.report({ increment: 0 })

      const repoName = repo

      try {
        await octokit.request(APIS.CREATE_REPO, { name: repoName })
        window.showInformationMessage('GitHub Blogger initialization completed')
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error'

        if (errorMsg.includes('already exists')) {
          window.showInformationMessage(
            `GitHub Blogger initialization completed. The ${repoName} repository already exists, skipping creation. You can now type "Open GitHub Blogger" in the command palette to start writing your blog.`
          )
          return
        }

        window.showErrorMessage(
          `GitHub Blogger initialization failed. Please check your configuration.\n${errorMsg}`
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
}
