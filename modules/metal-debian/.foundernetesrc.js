const path = require("path")
const fs = require("fs-extra")

module.exports = async () => {
  const isDist = await fs.pathExists("/snapshot")
  const distBinDirs = () => [
    "/snapshot/modules/metal-debian/bin",
    "/snapshot/modules/machines/bin",
  ]
  const devBinDirs = () => {
    const devBinRoot = path.resolve(path.dirname(process.argv[1]), "..", "..")
    return [
      `${devBinRoot}/modules/metal-debian/bin`,
      `${devBinRoot}/modules/machines/bin`,
    ]
  }
  const { env } = process
  return {
    sudo: true,
    sudoPassword: env.F10S_METAL_DEBIAN_SUDO_PASSWORD,
    execEnv: {
      SYSTEMD_PAGER: "",
      LC_ALL: "C",
    },
    execEnforceLeastPrivilege: true,
    execEnforceLeastPrivilegeUseGoSu: true,
    extractBinPath: isDist ? distBinDirs() : devBinDirs(),
    remoteCwd: env.F10S_METAL_DEBIAN_REMOTE_CWD || "/opt/metal-debian",
  }
}
