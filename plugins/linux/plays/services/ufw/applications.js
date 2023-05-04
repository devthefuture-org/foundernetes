const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

const defaultsDeep = require("lodash.defaultsdeep")
const cloneDeep = require("lodash.clonedeep")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    const { templateVars = {} } = vars
    const applicationsTemplateVarsDefaults = {}
    let { applications: applicationsTemplateVars = {}, ...commonTemplateVars } =
      templateVars
    applicationsTemplateVars = cloneDeep(applicationsTemplateVars)
    commonTemplateVars = cloneDeep(commonTemplateVars)
    defaultsDeep(applicationsTemplateVars, applicationsTemplateVarsDefaults)
    await plays.std.confDir({
      source: path.join(__dirname, "applications.d"),
      target: "/etc/ufw/applications.d",
      templateVars: commonTemplateVars,
      templateVarsByGroup: applicationsTemplateVars,
      sudoWrite: true,
      removeUnlistedFiles: true,
      convention: true,
    })
  })
