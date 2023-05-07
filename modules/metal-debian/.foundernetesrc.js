module.exports = async () => ({
  __dirname,
  sudo: true,
  sudoPassword: process.env.F10S_DEBIANMETAL_SUDO_PASSWORD,
  execEnv: {
    SYSTEMD_PAGER: "",
    LC_ALL: "C",
  },
  execEnforceLeastPrivilege: true,
  execEnforceLeastPrivilegeUseGoSu: true,
})
