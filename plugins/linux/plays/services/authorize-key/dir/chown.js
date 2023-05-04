const path = require("path")

const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) =>
  createComposer(async (vars) => {
    const { authorizedKeysFile, userInfos } = vars

    await plays.std.chown({
      file: path.dirname(authorizedKeysFile),
      uid: userInfos.uid,
      gid: userInfos.gid,
      sudo: true,
    })
  })
