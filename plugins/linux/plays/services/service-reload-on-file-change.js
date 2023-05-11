const { $ } = require("@foundernetes/blueprint")

const onFileChange = require("~/plays/std-factories/on-file-change")

module.exports = async (deps) => {
  const { loaders } = deps
  const getDate = async (vars) => {
    return loaders.services.serviceChangeDate({ name: vars.serviceName })
  }
  const run = async (vars) => {
    const { serviceName, restart = false } = vars
    const action = restart ? "restart" : "reload"
    $(`systemctl ${action} ${serviceName}`, { sudo: true })
  }

  const play = { run, postCheckRetry: 3, tags: ["yolo-composer"] }

  return onFileChange({ ...deps, getDate, play })
}
