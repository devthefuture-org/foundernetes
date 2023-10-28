const fs = require("fs-extra")
const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (_vars) => {
    if (await fs.pathExists("machine/network/interfaces")) {
      await plays.std.ensureFile({
        contentFile: "machine/network/interfaces",
        file: "/etc/network/interfaces",
        sudoWrite: true,
      })
    }

    if (await fs.pathExists("machine/network/interfaces.d")) {
      await plays.std.confDir({
        source: `machine/network/interfaces.d`,
        target: "/etc/network/interfaces.d",
        sudoWrite: true,
        convention: true,
      })
    }

    await plays.services.serviceReloadOnFileChange({
      file: ["/etc/network/interfaces", "/etc/network/interfaces.d"],
      serviceName: "networking",
    })
  })
