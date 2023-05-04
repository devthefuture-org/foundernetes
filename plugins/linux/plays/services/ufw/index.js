const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays, children }) =>
  createComposer(async (vars = {}) => {
    await children.enable(vars)

    await children.default(vars)

    const { logging } = vars
    await children.logging(logging)

    await children.applications(vars)

    await children.rules({
      rules: [],
      removeUnlistedRules: true,
      ...vars,
    })

    await plays.services.serviceReloadOnFileChange(
      {
        file: "/etc/ufw",
        recursive: true,
        serviceName: "ufw",
        restart: true,
      },
      { tags: ["yolo-playbook"] }
    )
    await plays.services.activeService({
      name: "ufw",
    })
  })

Object.assign(module.exports, {
  default: require("./default"),
  enable: require("./enable"),
  logging: require("./logging"),
  rules: require("./rules"),
  applications: require("./applications"),
})
