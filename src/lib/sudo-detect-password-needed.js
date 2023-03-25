const { execa } = require("~cjs/execa")

module.exports = async () => {
  const { exitCode } = await execa("sudo", ["-n", "true"], { reject: false })
  return exitCode !== 0
}
