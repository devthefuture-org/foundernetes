const { createComposer } = require("@foundernetes/blueprint")

module.exports = async ({ plays }) => {
  return createComposer(async () => {
    await plays.std.lineInFile({
      file: "/etc/default/grub",
      find: 'GRUB_CMDLINE_LINUX_DEFAULT="*"',
      line: (line) => {
        if (!line) {
          line = 'GRUB_CMDLINE_LINUX_DEFAULT=""'
        }
        if (!line.includes("consoleblank")) {
          line = `${line.slice(0, -1)} consoleblank=60"`
        }
        return line
      },
      sudoWrite: true,
    })
    await plays.services.updateGrubOnDefaultChange()
  })
}
