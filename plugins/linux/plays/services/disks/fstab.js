const fs = require("fs-extra")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) => {
  return createPlay(async (disk) => {
    let { device } = disk

    const {
      mountPath,
      fsType = null,
      fsOptions = null,
      fsDump = null,
      fsPass = null,
      useUUID = true,
      updateUUID = device.startsWith("UUID="),
    } = disk

    if (useUUID && (!device.startsWith("UUID=") || updateUUID)) {
      const { stdout } = await $(`blkid ${device} -o export`, { sudo: true })
      const blkidLines = stdout.split("\n")
      const deviceUUID = blkidLines.find((line) => line.startsWith("UUID="))
      if (!deviceUUID) {
        throw new Error("Could not find UUID in blkid output")
      }
      device = deviceUUID
    }

    return {
      async check() {
        const fstab = await loaders.services.fstab()
        const mountEntry = fstab.find(
          ({ fs_file: fsFile }) => fsFile === mountPath
        )
        if (!mountEntry) {
          return false
        }
        const {
          fs_spec: fsSpec,
          fs_vfstype: fsVfstype,
          fs_mntops: fsMntops,
          fs_freq: fsFreq,
          fs_passno: fsPassno,
        } = mountEntry
        if (updateUUID && fsSpec !== device) {
          return false
        }
        if (fsType !== null && fsType !== fsVfstype) {
          return false
        }
        if (fsDump !== null && fsDump !== fsFreq) {
          return false
        }
        if (fsPass !== null && fsPass !== fsPassno) {
          return false
        }
        if (fsOptions !== null && fsOptions !== fsMntops) {
          return false
        }
        return true
      },
      async run() {
        const fstab = await loaders.services.fstab()
        let mountEntry = fstab.find(
          ({ fs_file: fsFile }) => fsFile === mountPath
        )
        if (!mountEntry) {
          mountEntry = {
            fs_spec: device,
            fs_file: mountPath,
            fs_vfstype: fsType || "ext4",
            fs_mntops: fsOptions || "defaults",
            fs_freq: fsDump || "0",
            fs_passno: fsPass || "0",
          }
          fstab.push(mountEntry)
        } else {
          const {
            fs_spec: fsSpec,
            fs_vfstype: fsVfstype,
            fs_mntops: fsMntops,
            fs_freq: fsFreq,
            fs_passno: fsPassno,
          } = mountEntry
          if (updateUUID && fsSpec !== device) {
            mountEntry.fs_spec = device
          }
          if (fsType !== null && fsType !== fsVfstype) {
            mountEntry.fs_vfstype = fsType
          }
          if (fsDump !== null && fsDump !== fsFreq) {
            mountEntry.fs_freq = fsDump
          }
          if (fsPass !== null && fsPass !== fsPassno) {
            mountEntry.fs_passno = fsPass
          }
          if (fsOptions !== null && fsOptions !== fsMntops) {
            mountEntry.fs_mntops = fsOptions
          }
        }
        const fstabLines = []
        for (const entry of fstab) {
          fstabLines.push(
            `${entry.fs_spec} ${entry.fs_file} ${entry.fs_vfstype} ${entry.fs_mntops} ${entry.fs_freq} ${entry.fs_passno}`
          )
        }
        const fstabContent = fstabLines.join("\n")

        if (!(await fs.pathExists("/etc/fstab.bak"))) {
          await $("cp /etc/fstab /etc/fstab.bak", { sudo: true })
        }
        await fs.writeFile("/etc/fstab", fstabContent)
      },
    }
  })
}
