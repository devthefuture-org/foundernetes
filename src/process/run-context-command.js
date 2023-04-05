const { EventEmitter } = require("node:events")

const ctx = require("~/ctx")

const sudoFactory = require("~/lib/sudo-factory")
const sudoAskPassword = require("~/lib/sudo-ask-password")
const isRoot = require("~/lib/is-root")

const isAbortError = require("~/utils/is-abort-error")

const commandAbortController = require("~/cli/abort-controller")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

const { exitCodes } = require("~/error/constants")

const { getPlaybookSet } = require("~/playbook/load-cwd")

module.exports = async ({ callback, targets = [] }) => {
  const config = ctx.require("config")
  const logger = ctx.require("logger")
  const staticDefinitions = ctx.require("staticDefinitions")

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

  let { playbookSet } = staticDefinitions
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
      Object.entries(playbookFactories).map(([name, playbookFactory]) =>
        playbookFactory({}, { name })
      )
    )

    await callback(playbooks)

    exitCode = exitCodes.SUCCESS
  } catch (error) {
    if (isAbortError(error)) {
      exitCode = exitCodes.INTERRUPTED_GRACEFULLY
    } else if (error instanceof FoundernetesPlayPostCheckError) {
      exitCode = exitCodes.FAILED_POST_CHECK
    } else {
      logger.error(error)
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

  await logger.end()

  process.exit(exitCode)
}
