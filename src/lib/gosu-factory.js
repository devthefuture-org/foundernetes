const { execa } = require("~cjs/execa")

module.exports = (options = {}) => {
  const { execaOptions: execaDefaultOptions = {} } = options
  const { user, group } = options

  return (command, args = [], execaOptions = {}) => {
    const gosuArgs = [`${user}${group ? `:${group}` : ""}`, command, ...args]

    const child = execa("gosu", gosuArgs, {
      ...execaDefaultOptions,
      ...execaOptions,
    })

    return child
  }
}
