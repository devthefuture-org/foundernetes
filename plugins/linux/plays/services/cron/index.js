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
      source: path.join(__dirname, "cron.d"),
      target: "/etc/cron.d",
      templateVars: commonTemplateVars,
      templateVarsByGroup: tasks,
      sudoWrite: true,
      convention: true,
    })

    const periodDirs = [
      path.join(__dirname, "cron.daily"),
      path.join(__dirname, "cron.weekly"),
      path.join(__dirname, "cron.monthly"),
    ]
    for (const source of periodDirs) {
      await plays.std.confDir({
        source,
        target: path.join("/etc", path.basename(source)),
        templateVars: commonTemplateVars,
        templateVarsByGroup: tasks,
        sudoWrite: true,
        convention: true,
      })
    }

    await plays.services.activeService({
      name: "cron",
    })
  })
