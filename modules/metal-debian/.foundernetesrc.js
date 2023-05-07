const fs = require("fs-extra")

module.exports = async () => {
  const isDist = await fs.pathExists("/snapshot")
  return {
    sudo: true,
    sudoPassword: process.env.F10S_DEBIANMETAL_SUDO_PASSWORD,
    execEnv: {
      SYSTEMD_PAGER: "",
      LC_ALL: "C",
    },
    execEnforceLeastPrivilege: true,
    execEnforceLeastPrivilegeUseGoSu: true,
    extractBinPath: isDist
      ? ["/snapshot/modules/metal-debian/bin", "/snapshot/modules/machines/bin"]
      : [],
  }
}
