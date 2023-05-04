const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    const { file = "/etc/profile.d/systemd_pager.sh", pager = "" } = vars
    const content = `# this file was generated automatically and is handled by foundernetes, do not modify it manually, your changes here will be lost
export SYSTEMD_PAGER='${pager}'`
    return plays.std.ensureFile({ file, content, sudoWrite: true })
  })
