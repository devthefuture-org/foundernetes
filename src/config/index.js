const loadStructuredConfig = require("~/utils/load-structured-config")

module.exports = async (opts = {}, inlineConfigs = [], env = process.env) => {
  const rootConfigOverride = {
    cwd: {
      env: "F10S_CWD",
      option: "cwd",
      default: process.cwd(),
    },
    playbooksDir: {
      env: "F10S_PLAYBOOKS_DIR",
      default: "playbooks",
    },
  }

  const config = await loadStructuredConfig({
    inlineConfigs,
    configOverride: rootConfigOverride,
    options: opts,
    env,
  })

  return config
}
