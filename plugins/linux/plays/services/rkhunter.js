const { createComposer } = require("@foundernetes/blueprint")

// see https://github.com/crunchsec/rkhunter/blob/master/files/rkhunter.conf

module.exports = async ({ plays }) =>
  createComposer(async (_vars = {}) => {
    // const iterator = ctx.require("iterator")

    // const rkhunterConfigFile = "/etc/default/rkhunter"
    // const rkhunterConfigFile = "/etc/rkhunter.conf"
    const rkhunterConfigFile = "/etc/rkhunter.conf.local"
    await plays.std.configFile({
      file: rkhunterConfigFile,
      sudoWrite: true,
      separator: "=",
      quote: '"',
      // commentFound: true,
      // commentStartChar: "#",
      listSeparator: " ",
      configMap: {
        CRON_DAILY_RUN: true,
        PKGMGR: "DPKG",
        ALLOW_SSH_ROOT_USER: "NO",
        SCRIPTWHITELIST: [
          // "/usr/bin/egrep",
          // "/usr/bin/fgrep",
          // "/usr/bin/which",
          // "/usr/bin/ldd",
          // "/usr/bin/lwp-request",
          // "/usr/sbin/adduser",
          // "/usr/sbin/prelink",
          // "/usr/sbin/unhide.rb",
        ],
      },
    })

    await plays.std.ensureFile({
      file: "/etc/apt/apt.conf.d/98-rkhunter",
      content: `DPkg::Post-Invoke {
        "rkhunter --update;"
        "rkhunter --propupdate";
      };`,
      sudoWrite: true,
    })
  })
