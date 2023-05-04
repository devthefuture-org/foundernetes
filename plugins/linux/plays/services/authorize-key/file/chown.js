const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars) => {
    const { authorizedKeysFile, userInfos } = vars

    await plays.std.chown({
      file: authorizedKeysFile,
      uid: userInfos.uid,
      gid: userInfos.gid,
      sudo: true,
    })
  })
