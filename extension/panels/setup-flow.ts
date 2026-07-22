import type { ExtensionContext, QuickPickItem } from 'vscode'
import type { InputValidator, QuickInputFlow, QuickInputStep } from './quick-input-flow'
import type { ColorMode, SettingKey, Settings } from '~/types'
import { Octokit } from '@octokit/core'
import { ConfigurationTarget, l10n, ProgressLocation, window, workspace } from 'vscode'

import { APIS, EXTENSION_NAME } from '@/constants'
import { getSettings, invalidateSettingsCache } from '@/utils'
import { COLOR_MODE, SETTING_KEY } from '~/constants'
import { QuickInputFlow as SetupQuickInputFlow } from './quick-input-flow'

type SetupState = Partial<Settings>
type TextSettingKey = Exclude<SettingKey, typeof SETTING_KEY.COLOR_MODE>

const SETUP_STEP_TYPE = {
  INPUT: 'input',
  QUICK_PICK: 'quick-pick',
} as const

interface ColorModeItem extends QuickPickItem {
  value: ColorMode
}

interface TextSetupStep {
  type: typeof SETUP_STEP_TYPE.INPUT
  key: TextSettingKey
  prompt: () => string
  validate: InputValidator
}

interface ColorModeSetupStep {
  type: typeof SETUP_STEP_TYPE.QUICK_PICK
  key: typeof SETTING_KEY.COLOR_MODE
  placeholder: () => string
  items: ColorModeItem[]
  defaultValue: ColorMode
}

type SetupStep = TextSetupStep | ColorModeSetupStep

const SETUP_TITLE = l10n.t('GitHub Blogger Initialization')
const SETTING_KEYS: SettingKey[] = [
  SETTING_KEY.TOKEN,
  SETTING_KEY.USER,
  SETTING_KEY.BRANCH,
  SETTING_KEY.REPO,
  SETTING_KEY.COLOR_MODE,
]
const COLOR_MODE_ITEMS: ColorModeItem[] = [
  {
    label: l10n.t('System'),
    detail: l10n.t('Follow the current Editor color mode'),
    value: COLOR_MODE.SYSTEM,
  },
  {
    label: l10n.t('Light'),
    detail: l10n.t('Always use light mode'),
    value: COLOR_MODE.LIGHT,
  },
  {
    label: l10n.t('Dark'),
    detail: l10n.t('Always use dark mode'),
    value: COLOR_MODE.DARK,
  },
]

const SETUP_STEPS = [
  {
    type: SETUP_STEP_TYPE.INPUT,
    key: SETTING_KEY.USER,
    prompt: () => l10n.t('Enter your GitHub username'),
    validate: validateRequired,
  },
  {
    type: SETUP_STEP_TYPE.INPUT,
    key: SETTING_KEY.TOKEN,
    prompt: () => l10n.t('Enter your GitHub Personal Access Token (classic)'),
    validate: validateRequired,
  },
  {
    type: SETUP_STEP_TYPE.INPUT,
    key: SETTING_KEY.REPO,
    prompt: () =>
      l10n.t(
        'Enter your blog repository name. It will be created automatically if it does not exist.'
      ),
    validate: validateRequired,
  },
  {
    type: SETUP_STEP_TYPE.INPUT,
    key: SETTING_KEY.BRANCH,
    prompt: () =>
      l10n.t(
        'Enter your blog repository branch name. Used for post/image storage, usually the default branch'
      ),
    validate: validateRequired,
  },
  {
    type: SETUP_STEP_TYPE.QUICK_PICK,
    key: SETTING_KEY.COLOR_MODE,
    placeholder: () => l10n.t('Select your preferred color mode'),
    items: COLOR_MODE_ITEMS,
    defaultValue: COLOR_MODE.LIGHT,
  },
] satisfies SetupStep[]

export default async function setupFlow(_context: ExtensionContext) {
  const settings = await collectSetupSettings()
  if (!settings) {
    return
  }

  await saveSetupSettings(settings)
  await initializeRepository(settings)
}

async function collectSetupSettings() {
  const setupState: SetupState = { ...getSettings() }
  const completed = await SetupQuickInputFlow.run(createSetupInputSteps(setupState))
  if (!completed) {
    return undefined
  }

  return normalizeSetupSettings(setupState)
}

function createSetupInputSteps(setupState: SetupState) {
  const totalSteps = SETUP_STEPS.length
  let inputSteps: QuickInputStep[] = []

  inputSteps = SETUP_STEPS.map((setupStep, index) => {
    return async input => {
      await collectSetupStep({
        input,
        setupStep,
        setupState,
        currentStep: index + 1,
        totalSteps,
      })

      return inputSteps[index + 1]
    }
  })

  return inputSteps[0]
}

async function collectSetupStep({
  input,
  setupStep,
  setupState,
  currentStep,
  totalSteps,
}: {
  input: QuickInputFlow
  setupStep: SetupStep
  setupState: SetupState
  currentStep: number
  totalSteps: number
}) {
  if (setupStep.type === SETUP_STEP_TYPE.INPUT) {
    setupState[setupStep.key] = await input.showInputBox({
      title: SETUP_TITLE,
      step: currentStep,
      totalSteps,
      value: setupState[setupStep.key] || '',
      prompt: setupStep.prompt(),
      validate: setupStep.validate,
      shouldResume,
    })
    return
  }

  const currentValue = setupState[setupStep.key] ?? setupStep.defaultValue
  const activeItem = setupStep.items.find(item => item.value === currentValue) ?? setupStep.items[0]

  const selectedItem = await input.showQuickPick({
    title: SETUP_TITLE,
    step: currentStep,
    totalSteps,
    items: setupStep.items,
    activeItem,
    placeholder: setupStep.placeholder(),
    shouldResume,
  })

  setupState[setupStep.key] = selectedItem.value
}

function normalizeSetupSettings(setupState: SetupState): Settings {
  return {
    [SETTING_KEY.TOKEN]: setupState[SETTING_KEY.TOKEN] ?? '',
    [SETTING_KEY.USER]: setupState[SETTING_KEY.USER] ?? '',
    [SETTING_KEY.REPO]: setupState[SETTING_KEY.REPO] ?? '',
    [SETTING_KEY.BRANCH]: setupState[SETTING_KEY.BRANCH] ?? '',
    [SETTING_KEY.COLOR_MODE]: setupState[SETTING_KEY.COLOR_MODE] ?? COLOR_MODE.LIGHT,
  }
}

async function saveSetupSettings(settings: Settings) {
  const configuration = workspace.getConfiguration(EXTENSION_NAME)

  for (const key of SETTING_KEYS) {
    await configuration.update(key, settings[key], ConfigurationTarget.Global)
  }

  invalidateSettingsCache()
}

async function initializeRepository(settings: Settings) {
  const octokit = new Octokit({ auth: settings[SETTING_KEY.TOKEN] })

  await window.withProgress(
    {
      location: ProgressLocation.Window,
      cancellable: false,
      title: l10n.t('Initializing GitHub Blogger'),
    },
    async progress => {
      progress.report({ increment: 0 })

      try {
        await octokit.request(APIS.CREATE_REPO, { name: settings[SETTING_KEY.REPO] })
        showSetupSuccessWithCreatedRepository(settings[SETTING_KEY.REPO])
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : l10n.t('Unknown error')

        if (errorMessage.includes('already exists')) {
          showSetupSuccess()
          return
        }

        showSetupFailure(errorMessage)
      }

      progress.report({ increment: 100 })
    }
  )
}

function showSetupSuccessWithCreatedRepository(repoName: string) {
  window.showInformationMessage(
    l10n.t(
      'GitHub Blogger initialization completed. Repository "{0}" has been created. You can now run "Open GitHub Blogger" from the command palette to start writing your blog.',
      repoName
    )
  )
}

function showSetupSuccess() {
  window.showInformationMessage(
    l10n.t(
      'GitHub Blogger initialization completed. You can now run "Open GitHub Blogger" from the command palette to start writing your blog.'
    )
  )
}

function showSetupFailure(errorMessage: string) {
  window.showErrorMessage(
    l10n.t(
      'GitHub Blogger initialization failed. Please check your configuration.\n{0}',
      errorMessage
    )
  )
}

async function shouldResume() {
  return Promise.resolve(false)
}

async function validateRequired(value: string) {
  return !value ? l10n.t('Cannot be empty') : undefined
}
