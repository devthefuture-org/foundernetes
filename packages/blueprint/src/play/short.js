const create = require("./create")

module.exports = async (definition) => (await create(() => definition))()
