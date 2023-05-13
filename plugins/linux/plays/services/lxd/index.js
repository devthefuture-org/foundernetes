const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ children }) =>
  createComposer(
    async (vars = {}) => {
      await children.host({}, { tags: ["lxd"] })
      const { preseed } = vars
      await children.init({ preseed }, { tags: ["lxd"] })
    },
    { tags: ["lxd"] }
  )

Object.assign(module.exports, {
  init: require("./init"),
  host: require("./host"),
})