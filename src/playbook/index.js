const path = require("path")

const async = require("async")
const fs = require("fs-extra")
const nctx = require("nctx")

const ctx = require("~/ctx")
const playbookKey = require("~/utils/playbook-key")
const logError = require("~/error/log-error")

const asyncCollCtx = require("~/common/async-coll-ctx")
const playbookCtx = require("./ctx")

const exts = [".js"]

module.exports = async (options, targets = []) => {
  const config = ctx.require("config")
  const logger = ctx.require("logger")

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

  const playbooksContext = {}

  const runPlaybook = async (playbook) => {
    const chalk = (await import("chalk")).default
    const playbookLogger = playbookCtx.require("logger")
    const counter = playbookCtx.require("counter")
    try {
      await playbook(playbooksContext)
    } catch (error) {
      logError(logger, error)
    }
    const msg = `report: ${chalk.green(`OK=${counter.ok}`)} ${chalk.cyanBright(
      `Changed=${counter.changed}`
    )} ${chalk.red(`Failed=${counter.failed}`)}`
    playbookLogger.info(msg)
  }

  try {
    const playbooks =
      !definedTarget && rootPlaybook
        ? { index: rootPlaybook }
        : Object.entries(existingPlaybooks).reduce((acc, [key, playbook]) => {
            if (!playbook) {
              return acc
            }
            if (definedTarget) {
              const playbookTargets = [key, ...(playbook.tags || [])]
              if (!targets.some((t) => playbookTargets.includes(t))) {
                return acc
              }
            }
            acc[key] = playbook
            return acc
          }, {})

    playbookCtx.provide()
    asyncCollCtx.provide()

    const parallel = options.P
    const method = parallel ? async.eachOf : async.eachOfSeries
    await method(playbooks, async (playbook, playbookName) =>
      nctx.fork(async () => {
        const counter = { ok: 0, changed: 0, failed: 0, total: 0 }
        playbookCtx.set("counter", counter)
        playbookCtx.set("playbookName", playbookName)
        playbookCtx.set("logger", logger.child({ playbookName }))
        await runPlaybook(playbook)
      }, [playbookCtx])
    )
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}
