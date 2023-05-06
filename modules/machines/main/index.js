const { EventEmitter } = require("node:events")

const ctx = require("@foundernetes/ctx")
const blueprint = require("@foundernetes/blueprint")
const createLogger = require("@foundernetes/std/logger-factory")

const commandAbortController = require("@foundernetes/blueprint/src/cli/abort-controller")

const playbooks = require("~/playbooks")

module.exports = async (params = {}) => {
  return ctx.provide(async () => {
    const config = await blueprint.config()
    ctx.setConfig(config)

    const logger = createLogger({
      logLevel: config.logLevel,
    })
    ctx.setLogger(logger)

    const events = new EventEmitter()
    ctx.set("events", events)

    const abortController = commandAbortController()
    const abortSignal = abortController.signal
    ctx.assign({
      abortController,
      abortSignal,
    })

    const playbook = await playbooks.machines()

    playbook.playbookName = "machines"

    await playbook(params)
  })
}
