const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays, mod }) =>
  createComposer(async (_vars = {}) => {
    const configMap = {
      // Enable the update/upgrade script (0=disable)
      "APT::Periodic::Enable": "1",

      // Do "apt-get update" automatically every n-days (0=disable)
      "APT::Periodic::Update-Package-Lists": "1",

      // Do "apt-get upgrade --download-only" every n-days (0=disable)
      "APT::Periodic::Download-Upgradeable-Packages": "1",

      // Run the "unattended-upgrade" security upgrade script
      // every n-days (0=disabled)
      // Requires the package "unattended-upgrades" and will write
      // a log in /var/log/unattended-upgrades
      "APT::Periodic::Unattended-Upgrade": "1",

      // Do "apt-get autoclean" every n-days (0=disable)
      "APT::Periodic::AutocleanInterval": "7",

      //  - Send report mail to root
      //      0:  no report             (or null string)
      //      1:  progress report       (actually any string)
      //      2:  + command outputs     (remove -qq, remove 2>/dev/null, add -d)
      //      3:  + trace on
      "APT::Periodic::Verbose": "1",

      // sleep for a random interval of time (default 30min)
      "APT::Periodic::RandomSleep": "1800",
    }

    // const configFile = "/etc/apt/apt.conf.d/10periodic" // ubuntu
    const configFile = "/etc/apt/apt.conf.d/02periodic" // debian

    await plays.std.configFile({
      configMap,
      separator: " ",
      quote: '"',
      commentFound: true,
      commentStartChar: "//",
      lineEndChar: ";",
      file: configFile,
      sudoWrite: true,
    })

    await mod.serviceReloadOnFileChange({
      file: configFile,
      serviceName: "unattended-upgrades",
      restart: true,
    })
    await mod.activeService({
      name: "unattended-upgrades",
    })
  })
