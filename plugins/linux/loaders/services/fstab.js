const { createLoader, $ } = require("@foundernetes/blueprint")

module.exports = () => {
  return createLoader({
    load: async () => {
      const { stdout } = await $("cat /etc/fstab", {
        sudo: true,
        logStdout: false,
      }).pipeStdout($("jc --fstab -r", { logStdout: false }))
      const data = JSON.parse(stdout)
      return data
    },
  })
}
