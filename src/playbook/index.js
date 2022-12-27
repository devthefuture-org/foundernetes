const path = require("path")
const { EventEmitter } = require("node:events")

const async = require("async")
const fs = require("fs-extra")

const ctx = require("~/ctx")
const playbookKey = require("~/utils/playbook-key")
const isAborted = require("~/utils/is-aborted")
const commandAbortController = require("~/cli/abort-controller")

const { exitCodes } = require("~/error/constants")

const exts = [".js"]

module.exports = async (options, targets = []) => {
  const config = ctx.require("config")
  const logger = ctx.require("logger")

  const events = new EventEmitter()
  ctx.set("events", events)

  const abortController = commandAbortController()
  const abortSignal = abortController.signal
  ctx.assign({
    abortController,
    abortSignal,
  })

  const { cwd, playbooksDir } = config
  const playbooksPath = `${cwd}/${playbooksDir}`

  let ls = await fs.readdir(playbooksPath)
  ls = ls.sort()

  const existingPlaybooks = {}

  let rootPlaybook

  for (const f of ls) {
    let key
    const inc = `${playbooksPath}/${f}`
    if ((await fs.stat(inc)).isDirectory()) {
      if (!(await fs.pathExists(`${inc}/index.js`))) {
        continue
      }
      key = f
    } else {
      const ext = path.extname(f)
      if (!exts.includes(ext)) {
        continue
      }
      key = f.substring(0, f.length - ext.length)
    }
    const playbookCallback = require(inc)
    if (key === "index") {
      rootPlaybook = playbookCallback
      continue
    }
    key = playbookKey(key)
    existingPlaybooks[key] = playbookCallback
  }

  const definedTarget = targets.length > 0

  let exitCode
  try {
    const playbookFactories =
      !definedTarget && rootPlaybook
        ? { index: rootPlaybook }
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
        playbookFactory({ name })
      )
    )

    const parallel = options.P
    const method = parallel ? async.parallel : async.series
    await method(playbooks)
    exitCode = exitCodes.SUCCESS
  } catch (error) {
    if (isAborted(error)) {
      exitCode = exitCodes.INTERRUPTED_GRACEFULLY
    } else {
      logger.error(error)
      exitCode = exitCodes.FAILED
    }
  }
  events.emit("finish", { exitCode })
  process.exit(exitCode)
}
