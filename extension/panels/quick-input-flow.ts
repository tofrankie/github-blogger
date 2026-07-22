import type { Disposable, QuickInput, QuickInputButton, QuickPickItem } from 'vscode'
import { QuickInputButtons, window } from 'vscode'

export type InputValidator = (value: string) => string | undefined | Promise<string | undefined>

export interface ShowInputBoxOptions {
  title: string
  step: number
  totalSteps: number
  value: string
  prompt: string
  validate: InputValidator
  buttons?: QuickInputButton[]
  shouldResume?: () => Promise<boolean>
}

export interface ShowQuickPickOptions<T extends QuickPickItem> {
  title: string
  step: number
  totalSteps: number
  items: T[]
  activeItem?: T
  placeholder: string
  buttons?: QuickInputButton[]
  shouldResume?: () => Promise<boolean>
}

export type QuickInputStep = (flow: QuickInputFlow) => Thenable<QuickInputStep | void>

class QuickInputFlowAction {
  static back = new QuickInputFlowAction()
  static cancel = new QuickInputFlowAction()
  static resume = new QuickInputFlowAction()
}

export class QuickInputFlow {
  static async run(start: QuickInputStep | undefined) {
    if (!start) {
      return true
    }

    const flow = new QuickInputFlow()
    return flow.stepThrough(start)
  }

  private current?: QuickInput

  private steps: QuickInputStep[] = []

  private async stepThrough(start: QuickInputStep) {
    let step: QuickInputStep | void = start
    while (step) {
      this.steps.push(step)
      if (this.current) {
        this.current.enabled = false
        this.current.busy = true
      }
      try {
        step = await step(this)
      } catch (err) {
        if (err === QuickInputFlowAction.back) {
          this.steps.pop()
          step = this.steps.pop()
        } else if (err === QuickInputFlowAction.resume) {
          step = this.steps.pop()
        } else if (err === QuickInputFlowAction.cancel) {
          this.disposeCurrentInput()
          return false
        } else {
          throw err
        }
      }
    }

    this.disposeCurrentInput()
    return true
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
  }: ShowInputBoxOptions) {
    const disposables: Disposable[] = []
    try {
      return await new Promise<string>((resolve, reject) => {
        const inputBox = window.createInputBox()
        let completed = false
        inputBox.title = title
        inputBox.step = step
        inputBox.totalSteps = totalSteps
        inputBox.value = value || ''
        inputBox.prompt = prompt
        inputBox.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ]
        let validating = validate(inputBox.value)

        disposables.push(
          inputBox.onDidTriggerButton(item => {
            if (item === QuickInputButtons.Back) {
              reject(QuickInputFlowAction.back)
            } else {
              completed = true
              resolve(inputBox.value)
              inputBox.hide()
            }
          }),
          inputBox.onDidAccept(async () => {
            const { value } = inputBox
            inputBox.enabled = false
            inputBox.busy = true
            if (!(await validate(value))) {
              completed = true
              resolve(value)
              inputBox.hide()
            }
            inputBox.enabled = true
            inputBox.busy = false
          }),
          inputBox.onDidChangeValue(async text => {
            const current = validate(text)
            validating = current
            const validationMessage = await current
            if (current === validating) {
              inputBox.validationMessage = validationMessage
            }
          }),
          inputBox.onDidHide(() => {
            if (completed) {
              return
            }
            ;(async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? QuickInputFlowAction.resume
                  : QuickInputFlowAction.cancel
              )
            })().catch(reject)
          })
        )

        this.disposeCurrentInput()
        this.current = inputBox
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
  }: ShowQuickPickOptions<T>) {
    const disposables: Disposable[] = []
    try {
      return await new Promise<T>((resolve, reject) => {
        const quickPick = window.createQuickPick<T>()
        let completed = false
        quickPick.title = title
        quickPick.step = step
        quickPick.totalSteps = totalSteps
        quickPick.placeholder = placeholder
        quickPick.items = items
        quickPick.activeItems = activeItem ? [activeItem] : []
        quickPick.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ]

        disposables.push(
          quickPick.onDidTriggerButton(item => {
            if (item === QuickInputButtons.Back) {
              reject(QuickInputFlowAction.back)
            }
          }),
          quickPick.onDidAccept(() => {
            const selectedItem = quickPick.activeItems[0] ?? quickPick.selectedItems[0]
            if (selectedItem) {
              completed = true
              resolve(selectedItem)
              quickPick.hide()
            }
          }),
          quickPick.onDidHide(() => {
            if (completed) {
              return
            }
            ;(async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? QuickInputFlowAction.resume
                  : QuickInputFlowAction.cancel
              )
            })().catch(reject)
          })
        )

        this.disposeCurrentInput()
        this.current = quickPick
        this.current.show()
      })
    } finally {
      disposables.forEach(disposable => {
        disposable.dispose()
      })
    }
  }

  private disposeCurrentInput() {
    if (this.current) {
      this.current.dispose()
      this.current = undefined
    }
  }
}
