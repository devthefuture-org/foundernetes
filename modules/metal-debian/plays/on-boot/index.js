const path = require("path")
const shellQuote = require("shell-quote")

const { createComposer } = require("@foundernetes/blueprint")

const cloneDeep = require("lodash/cloneDeep")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    await plays.std.ensureFile({
      file: "/opt/metal-debian-boot.sh",
      contentFile: path.join(__dirname, "opt", "metal-debian-boot.sh"),
      sudo: true,
    })
    await plays.std.chmod({
      file: "/opt/metal-debian-boot.sh",
      mode: "755",
      sudo: true,
    })

    const envContent = Object.entries(process.env)
      .filter(([key]) => key.startsWith("F10S_METALDEBIAN_"))
      .map(([key, val]) => {
        key = shellQuote.quote([key])
        val = shellQuote.quote([val])
        return `${key}=${val}`
      })
      .join("\n")

    await plays.std.ensureFile({
      file: "/opt/metal-debian/.env",
      content: envContent,
      sudo: true,
    })

    const { templateVars = {} } = vars
    let { system, ...commonTemplateVars } = templateVars
    commonTemplateVars = cloneDeep(commonTemplateVars)
    system = cloneDeep(system)
    await plays.std.confDir({
      source: path.join(__dirname, "system"),
      target: "/etc/systemd/system",
      templateVars: commonTemplateVars,
      templateVarsByGroup: system,
      sudoWrite: true,
      convention: true,
    })

    await plays.services.serviceEnable({
      serviceName: "f10s-metal-debian",
      checkForSymlink: true,
    })
  })
