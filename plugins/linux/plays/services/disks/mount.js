const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () => {
  return createPlay(async (disk) => {
    const {
      mountPath,
      device,
      auto = true,
      extraFlags = [],
      ensureUnmount = true,
    } = disk
    return {
      async check() {
        const isUUID = device.startsWith("UUID=")
        const { stdout, exitCode } = await $(
          `findmnt -n -o ${isUUID ? "UUID" : "SOURCE"} --target ${mountPath}`,
          {
            reject: false,
          }
        )
        if (exitCode !== 0) {
          return false
        }
        return stdout.split("\n").includes(isUUID ? device.slice(5) : device)
      },
      async run() {
        if (ensureUnmount) {
          await $(`umount -l ${mountPath}`, { sudo: true })
        }
        await $(`mkdir -p ${mountPath}`, { sudo: true })
        await $(
          `mount ${auto ? "-t auto" : ""} ${extraFlags.join(
            " "
          )} ${device} ${mountPath}`,
          { sudo: true }
        )
      },
    }
  })
}
