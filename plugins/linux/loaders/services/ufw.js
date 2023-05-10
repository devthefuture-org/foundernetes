const { createLoader, $ } = require("@foundernetes/blueprint")

module.exports = () => {
  const parseDefault = (def) => {
    const o = def
      .split(",")
      .map((s) => s.trim().replaceAll("(", "").replaceAll(")", "").split(" "))
      .reduce((acc, [value, key]) => {
        acc[key] = value
        return acc
      }, {})
    const { incoming = "deny", outgoing = "allow", routed = "allow" } = o
    return {
      incoming,
      outgoing,
      routed,
    }
  }
  const getConfig = async (command) => {
    const { stdout } = await $(command, {
      sudo: true,
      logStdout: false,
    }).pipeStdout($("jc --ufw -r", { logStdout: false }))
    const data = JSON.parse(stdout)
    return data
  }
  return createLoader({
    load: async (vars) => {
      const { type = "both" } = vars

      const data = {}

      if (type === "verbose" || type === "both") {
        const verboseData = await getConfig("ufw status verbose")
        Object.assign(data, verboseData)
        if (data.default) {
          data.default = parseDefault(data.default)
        }
        data.verboseRules = data.rules
      }

      if (type === "numbered" || type === "both") {
        const { rules } = await getConfig("ufw status numbered")
        data.numberedRules = rules
        data.rules = data.numberedRules
      }

      return data
    },
    cacheable: true,
  })
}
