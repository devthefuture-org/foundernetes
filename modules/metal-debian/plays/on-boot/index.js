const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

const cloneDeep = require("lodash.clonedeep")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    await plays.std.ensureFile({
      file: "/opt/metal-debian-boot.sh",
      contentFile: path.join(__dirname, "opt", "metal-debian-boot.sh"),
      sudoWrite: true,
    })
    await plays.std.chmod({
      file: "/opt/metal-debian-boot.sh",
      mode: "755",
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
      serviceName: "metal-debian-boot",
      checkForSymlink: true,
    })
  })
