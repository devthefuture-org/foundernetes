const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

// const defaultsDeep = require("lodash/defaultsDeep")
const cloneDeep = require("lodash/cloneDeep")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    const { templateVars = {} } = vars
    let { tasks, ...commonTemplateVars } = templateVars
    commonTemplateVars = cloneDeep(commonTemplateVars)
    tasks = cloneDeep(tasks)

    await plays.std.confDir({
      source: path.join(__dirname, "logrotate.d"),
      target: "/etc/logrotate.d",
      templateVars: commonTemplateVars,
      templateVarsByGroup: tasks,
      sudoWrite: true,
      convention: true,
    })

    await plays.services.serviceReloadOnFileChange({
      file: "/etc/logrotate.d",
      serviceName: "logrotate",
      restart: true,
    })
  })
