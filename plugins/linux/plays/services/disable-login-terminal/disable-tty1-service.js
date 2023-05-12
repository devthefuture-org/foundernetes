const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async () => {
    await plays.services.serviceEnable({
      serviceName: "getty@tty1",
      enable: false,
    })

    await plays.services.serviceReloadOnFileChange({
      file: "/etc/systemd/system/getty.target.wants/",
      serviceName: "systemd-logind",
      restart: true,
    })
  })
