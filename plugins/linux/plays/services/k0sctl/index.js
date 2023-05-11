const path = require("path")
const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")

const validateSudoerFile = require("~/lib/validate-sudoer-file")

module.exports = async ({ plays }) =>
  createComposer(async (vars = {}) => {
    const { user = "k0sctl", group = "k0sctl", uid, gid, password } = vars

    await plays.services.user({
      username: user,
      groupname: group,
      uid,
      gid,
      password,
    })

    await plays.std.confDir({
      source: path.join(__dirname, "sudoers.d"),
      target: "/etc/sudoers.d",
      templateVars: {
        user,
      },
      mode: "440",
      sudo: true,
      convention: true,
      validateFile: ({ content }) =>
        validateSudoerFile({ file: "-", input: content }),
    })

    const { authorizedKeys } = vars
    const iterator = ctx.require("iterator")
    await iterator.eachSeries(
      authorizedKeys,
      (publicKey) => plays.services.authorizeKey({ user, publicKey }),
      "authorizedKey"
    )
  })
