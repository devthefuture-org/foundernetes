const { EventEmitter } = require("node:events")

const isAbortError = require("@foundernetes/std/is-abort-error")
const ctx = require("@foundernetes/ctx")

const isRoot = require("@foundernetes/std/is-root")
const sudoFactory = require("~/lib/sudo-factory")
const sudoAskPassword = require("~/lib/sudo-ask-password")

const commandAbortController = require("~/cli/abort-controller")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

const { exitCodes } = require("~/error/constants")
const FoundernetesBeakpointError = require("~/error/breakpoint")

const { getPlaybookSet } = require("~/playbook/load-cwd")
const logError = require("~/error/log-error")

module.exports = async ({ callback, targets = [] }) => {
  const config = ctx.getConfig()
  const logger = ctx.getLogger()
  const projectConfig = ctx.require("projectConfig")

  const events = new EventEmitter()
  ctx.set("events", events)

  const abortController = commandAbortController()
  const abortSignal = abortController.signal
  ctx.assign({
    abortController,
    abortSignal,
  })

  const { sudo } = config
  if (sudo) {
    const sudoOptions = {}
    if (config.sudoAskPassword && !isRoot()) {
      const password = await sudoAskPassword()
      sudoOptions.password = password
    }
    ctx.set("sudo", await sudoFactory(sudoOptions))
  }

  let { playbookSet } = projectConfig
  if (!playbookSet) {
    playbookSet = await getPlaybookSet()
  }
  const { playbooks: existingPlaybooks, index: playbooksIndex } = playbookSet

  const definedTarget = targets.length > 0

  let exitCode
  try {
    const playbookFactories =
      !definedTarget && playbooksIndex
        ? { index: playbooksIndex }
        : Object.entries(existingPlaybooks).reduce(
            (acc, [key, playbookFactory]) => {
              if (!playbookFactory) {
                return acc
              }
              if (definedTarget) {
                const playbookTargets = [key, ...(playbookFactory.tags || [])]
                if (!targets.some((t) => playbookTargets.includes(t))) {
                  return acc
                }
              }
              acc[key] = playbookFactory
              return acc
            },
            {}
          )

    const playbooks = await Promise.all(
      Object.entries(playbookFactories).map(async ([name, playbookFactory]) => {
        const playbook = await playbookFactory()
        playbook.playbookName = name
        return playbook
      })
    )

    await callback(playbooks)

    exitCode = exitCodes.SUCCESS
  } catch (error) {
    if (isAbortError(error)) {
      exitCode = exitCodes.INTERRUPTED_GRACEFULLY
    } else if (error instanceof FoundernetesPlayPostCheckError) {
      logError(error)
      exitCode = exitCodes.FAILED_POST_CHECK
    } else if (error instanceof FoundernetesBeakpointError) {
      exitCode = exitCodes.SUCCESS
    } else {
      logError(error)
      exitCode = exitCodes.FAILED
    }
  }
  if (abortSignal.aborted && !exitCode) {
    exitCode = exitCodes.INTERRUPTED_GRACEFULLY
  }
  events.emit("finish", { exitCode })
  if (exitCode === exitCodes.INTERRUPTED_GRACEFULLY) {
    logger.warn("process was interrupted: exited gracefully")
  }

  process.exit(exitCode)
}
