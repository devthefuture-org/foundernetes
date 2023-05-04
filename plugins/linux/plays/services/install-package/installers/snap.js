const { createPlay, $, yaml } = require("@foundernetes/blueprint")

const checkCmd = require("../checks/cmd")

module.exports = async () => {
  const getSnapInfo = async ({
    name,
    version,
    latest,
    channel = !version && latest ? "stable" : null,
  }) => {
    const { stdout } = await $(`snap info ${name}`, {
      logStd: false,
    })
    const snapInfo = yaml.loadObject(stdout)
    let installedVersion
    const { installed } = snapInfo
    const isInstalled = !!installed
    if (isInstalled) {
      ;[installedVersion] = installed.split(" ")
    }
    if (!version && latest) {
      const [latestVersion] = snapInfo.channels[`latest/${channel}`].split(" ")
      version = latestVersion
    }
    return { snapInfo, isInstalled, installedVersion, version, channel }
  }

  return createPlay({
    defaultTags: ["*"],
    check: [
      checkCmd,
      async (vars) => {
        const { version, isInstalled, installedVersion } = await getSnapInfo(
          vars
        )
        if (!isInstalled) {
          return false
        }
        if (version) {
          return installedVersion === version
        }
        return true
      },
    ],
    runRetry: 2,
    runRetryOnError: true,
    async run(vars) {
      const { name } = vars
      const { version, channel, isInstalled } = await getSnapInfo(vars)

      await $(
        `snap ${isInstalled ? "refresh" : "install"} ${name} ${
          channel
            ? `--channel=${version ? `${version}/${channel}` : channel}`
            : ""
        }`,
        {
          sudo: true,
        }
      )

      return true
    },
  })
}
