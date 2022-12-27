const parseDuration = require("parse-duration")
const loadStructuredConfig = require("~/utils/load-structured-config")

module.exports = async (opts = {}, inlineConfigs = [], env = process.env) => {
  const rootConfigStructure = {
    cwd: {
      env: "F10S_CWD",
      option: "cwd",
      default: process.cwd(),
    },
  }

  const rootConfig = await loadStructuredConfig({
    inlineConfigs,
    configStructure: rootConfigStructure,
    options: opts,
    env,
  })

  const configStructure = {
    playbooksDir: {
      env: "F10S_PLAYBOOKS_DIR",
      default: "playbooks",
    },
    gracefullShutdownTimeout: {
      option: "gracefull-shutdown-timeout",
      env: "GRACEFULL_SHUTDOWN_TIMEOUT",
      default: "30s",
    },
    gracefullShutdownTimeoutMs: {
      defaultFunction: (config) =>
        parseDuration(config.gracefullShutdownTimeout),
    },
  }

  const { cwd } = rootConfig
  const config = await loadStructuredConfig({
    name: "foundernetes",
    cwd,
    rootConfig,
    inlineConfigs,
    configStructure,
    options: opts,
    env,
  })

  return config
}
