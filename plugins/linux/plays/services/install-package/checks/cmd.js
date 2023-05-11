const checkCmd = require("~/lib/check-cmd")

module.exports = async (vars, _common, { isPostCheck }) => {
  const { check } = vars
  if (check) {
    const checkResult = await checkCmd(check, {
      commandOptions: {
        logStd: isPostCheck,
        logErr: isPostCheck,
        sudo: true,
      },
    })
    if (!checkResult) {
      return false
    }
  }
  return true
}
