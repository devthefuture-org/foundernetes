const { createPlay, $ } = require("@foundernetes/blueprint")

const hasOption = (fsOptions, option) =>
  fsOptions
    .split(",")
    .map((o) => o.trim())
    .includes(option)

module.exports = async () => {
  return createPlay(async (disk) => {
    const {
      mountPath,
      device,
      fsOptions = "",
      auto = true,
      extraFlags = [],
      ensureUnmount = true,
    } = disk
    // noauto volumes (a LUKS volume unlocked by hand, for instance) are
    // mounted by the operator: the fstab entry is managed, the mount is not
    const noauto = hasOption(fsOptions, "noauto")
    // findmnt reports a bind mount as <device>[<subdir>], never as the bound
    // directory: for a bind mount, being mounted is the check
    const bind = hasOption(fsOptions, "bind")

    // --mountpoint, not --target: --target resolves an unmounted directory
    // to the filesystem that contains it
    const findmnt = (column) =>
      $(
        `findmnt -n${column ? ` -o ${column}` : ""} --mountpoint ${mountPath}`,
        { reject: false }
      )

    return {
      async check() {
        if (noauto) {
          return true
        }
        if (bind) {
          const { exitCode } = await findmnt()
          return exitCode === 0
        }
        const isUUID = device.startsWith("UUID=")
        const { stdout, exitCode } = await findmnt(isUUID ? "UUID" : "SOURCE")
        if (exitCode !== 0) {
          return false
        }
        return stdout.split("\n").includes(isUUID ? device.slice(5) : device)
      },
      async run() {
        const { exitCode: mounted } = await findmnt()
        if (ensureUnmount && mounted === 0) {
          await $(`umount -l ${mountPath}`, { sudo: true })
        }
        await $(`mkdir -p ${mountPath}`, { sudo: true })
        if (bind) {
          await $(`mount --bind ${device} ${mountPath}`, { sudo: true })
          return
        }
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
