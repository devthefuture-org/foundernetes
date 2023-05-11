const path = require("path")

const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")

const defaultsDeep = require("lodash/defaultsDeep")
const cloneDeep = require("lodash/cloneDeep")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    const {
      templateVars = {},
      jailD = "/etc/fail2ban/jail.d",
      filterD = "/etc/fail2ban/filter.d",
    } = vars

    const commonTemplateVarsDefaults = {
      ignoreip: "127.0.0.1/8",
    }

    const jaildTemplateVarsDefaults = {
      sshd: {
        port: 54567,
      },
    }
    const filterdTemplateVarsDefaults = {}

    let {
      jaild: jaildTemplateVars = {},
      filterd: filterdTemplateVars,
      ...commonTemplateVars
    } = templateVars

    commonTemplateVars = cloneDeep(commonTemplateVars)
    defaultsDeep(commonTemplateVars, commonTemplateVarsDefaults)

    jaildTemplateVars = cloneDeep(jaildTemplateVars)
    defaultsDeep(jaildTemplateVars, jaildTemplateVarsDefaults)

    filterdTemplateVars = cloneDeep(filterdTemplateVars)
    defaultsDeep(filterdTemplateVars, filterdTemplateVarsDefaults)

    const iterator = ctx.require("iterator")

    const logFiles = [
      "/var/log/auth.log",
      "/var/lib/portsentry/portsentry.history",
      "/var/log/ufw.log",
    ]
    await iterator.each(logFiles, async (file) => {
      await plays.std.fileExists({
        file,
        sudo: true,
      })
    })

    await plays.std.confDir({
      source: path.join(__dirname, "jail.d"),
      target: jailD,
      templateVars: commonTemplateVars,
      templateVarsByGroup: jaildTemplateVars,
      sudoWrite: true,
      convention: true,
    })

    await plays.std.confDir({
      source: path.join(__dirname, "filter.d"),
      target: filterD,
      templateVars: commonTemplateVars,
      templateVarsByGroup: filterdTemplateVars,
      sudoWrite: true,
      convention: true,
    })

    await plays.std.ensureFile({
      file: "/etc/rsyslog.d/51-auth.conf",
      content: "auth.* /var/log/auth.log",
      sudoWrite: true,
    })
    await plays.services.serviceReloadOnFileChange({
      file: "/etc/rsyslog.d",
      serviceName: "syslog",
      restart: true,
    })
    await plays.services.sshd.configSet({
      key: "SyslogFacility",
      value: "AUTH",
    })

    await plays.services.serviceReloadOnFileChange({
      file: jailD,
      serviceName: "fail2ban",
      restart: true,
    })
    await plays.services.activeService({
      name: "fail2ban",
    })
    await plays.std.cmd({
      checkCmd: "fail2ban-client --test",
    })
  })
