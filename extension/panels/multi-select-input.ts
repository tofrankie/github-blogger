import * as vscode from 'vscode'
import {window, QuickInputButtons, type ExtensionContext} from 'vscode'
import {Octokit} from '@octokit/core'

import {APIS, EXTENSION_NAME} from '../constants'
import {getSettings} from '../utils'

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

export default async function multiStepInput(context: ExtensionContext) {
  async function collectInputs() {
    const state: PartialState = await getSettings()
    await MultiStepInput.run(input => inputToken(input, state))
    return state
  }

  const title = 'GitHub Blogger Initialization'

  async function inputToken(input: any, state: any) {
    state.token = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 4,
      value: state.token || '',
      prompt: 'Enter your GitHub Personal Access Token (classic)',
      validate: validateNameIsUnique,
      shouldResume,
    })
    return input => inputUser(input, state)
  }

  async function inputUser(input: any, state: any) {
    state.user = await input.showInputBox({
      title,
      step: 2,
      totalSteps: 4,
      value: state.user || '',
      prompt: 'Enter your GitHub username (owner)',
      validate: validateNameIsUnique,
      shouldResume,
    })
    return input => inputBranch(input, state)
  }

  async function inputBranch(input: any, state: any) {
    state.branch = await input.showInputBox({
      title,
      step: 3,
      totalSteps: 4,
      value: state.branch || '',
      prompt:
        'Enter your GitHub branch name. Used for image and issue archives, usually the default branch',
      validate: validateNameIsUnique,
      shouldResume,
    })
    return input => inputRepoForIssue(input, state)
  }

  async function inputRepoForIssue(input: any, state: any) {
    state.repo = await input.showInputBox({
      title,
      step: 4,
      totalSteps: 4,
      value: state.repo || '',
      prompt:
        'Create an empty GitHub repository for your issue blog. Enter the repository name. If the repository already exists, it will not be recreated',
      validate: validateNameIsUnique,
      shouldResume,
    })
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise((_resolve, _reject) => {
      // noop
      // @ts-ignore
      _resolve()
    })
  }

  async function validateNameIsUnique(name: any) {
    // ...validate...
    return !name ? 'Cannot be empty' : undefined
  }

  const state: PartialState = await collectInputs()

  await vscode.workspace
    .getConfiguration(EXTENSION_NAME)
    .update('token', state.token, vscode.ConfigurationTarget.Global)

  await vscode.workspace
    .getConfiguration(EXTENSION_NAME)
    .update('user', state.user, vscode.ConfigurationTarget.Global)

  await vscode.workspace
    .getConfiguration(EXTENSION_NAME)
    .update('branch', state.branch, vscode.ConfigurationTarget.Global)

  await vscode.workspace
    .getConfiguration(EXTENSION_NAME)
    .update('repo', state.repo, vscode.ConfigurationTarget.Global)

  const octokit = new Octokit({auth: state.token})

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: false,
      title: 'Creating the issue blog',
    },
    async progress => {
      progress.report({increment: 0})

      const repoName = state.repo!

      try {
        await octokit.request(APIS.CREATE_REPO, {name: repoName})
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
      progress.report({increment: 100})
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
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput()
    return input.stepThrough(start)
  }

  private current?: vscode.QuickInput

  private steps: InputStep[] = []

  async stepThrough<T>(start: InputStep) {
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

  async showInputBox({title, step, totalSteps, value, prompt, validate, buttons, shouldResume}) {
    const disposables: any = []
    try {
      return await new Promise((resolve, reject) => {
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
              resolve(item)
            }
          }),
          input.onDidAccept(async () => {
            const {value} = input
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
      disposables.forEach(d => d.dispose())
    }
  }
}
