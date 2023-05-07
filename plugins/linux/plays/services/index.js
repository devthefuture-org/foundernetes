module.exports = {
  installPackage: require("./install-package"),
  authorizeKey: require("./authorize-key"),
  activeService: require("./active-service"),
  setSystemdPager: require("./set-systemd-pager"),
  serviceReloadOnFileChange: require("./service-reload-on-file-change"),
  serviceEnable: require("./service-enable"),
  aptUpdateOnSourceChanges: require("./apt-update-on-sources-change"),
  sshd: require("./sshd"),
  aptUpdate: require("./apt-update"),
  aptSources: require("./apt-sources"),
  fail2ban: require("./fail2ban"),
  portsentry: require("./portsentry"),
  rkhunter: require("./rkhunter"),
  unattendedUpgrades: require("./unattended-upgrades"),
  ufw: require("./ufw"),
  cron: require("./cron"),
  logrotate: require("./logrotate"),
  dns: require("./dns"),
  k0sctl: require("./k0sctl"),
  user: require("./user"),
  disableLoginTerminal: require("./disable-login-terminal"),
}
