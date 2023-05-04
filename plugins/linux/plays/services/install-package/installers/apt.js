const wildstring = require("wildstring")
const { createPlay, $ } = require("@foundernetes/blueprint")

const checkCmd = require("../checks/cmd")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    check: [
      checkCmd,
      async ({ name, version }, _extraContext, { isPostCheck }) => {
        const { stdout } = await $(`apt list --installed ${name}`, {
          logStd: isPostCheck,
        })
        if (!stdout.includes(`${name}/`)) {
          return false
        }
        if (version) {
          const lines = stdout.split("\n")
          const match = `* ${version} *`
          if (!lines.some((line) => wildstring.match(match, line))) {
            return false
          }
        }
        return true
      },
    ],
    runRetry: 2,
    runRetryOnError: true,
    async run(vars) {
      const { name, version } = vars

      const { lockWaitTimeout = 600 } = vars

      await $(
        `apt-get install -y ${name}${
          version ? `=${version}` : ""
        } -o=DPkg::Lock::Timeout=${lockWaitTimeout} -o=Dpkg::Use-Pty=0`,
        {
          env: {
            DEBIAN_FRONTEND: "noninteractive",
            // APT_LISTCHANGES_FRONTEND: "none",
          },
          sudo: true,
        }
      )

      return true
    },
  })
