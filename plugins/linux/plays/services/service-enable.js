const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) => {
  return createPlay({
    postCheckRetry: 3,
    async check(vars) {
      const { serviceName, checkForSymlink = false, enable = true } = vars

      if (checkForSymlink) {
        const initConfig = await loaders.std.ini({
          file: `/etc/systemd/system/${serviceName}.service`,
        })
        const wantedBy = initConfig.Install.WantedBy
        const { target } = await loaders.std.symlink({
          link: `/etc/systemd/system/${wantedBy}.wants/${serviceName}.service`,
        })
        return target === `/etc/systemd/system/${serviceName}.service`
      }

      const expectedState = enable ? "enabled" : "disabled"
      const unitFileState = await loaders.services.serviceInfos({
        name: serviceName,
        field: "UnitFileState",
      })
      return unitFileState === expectedState
    },
    async run(vars) {
      const { serviceName, enable = true } = vars
      const action = enable ? "enable" : "disable"
      await $(`systemctl ${action} ${serviceName}`, { sudo: true })
    },
  })
}
