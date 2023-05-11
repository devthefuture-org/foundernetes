const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    async check(vars) {
      const { filename, key, value } = vars
      const { stdout } = await $(
        `sshd-config get ${key} ${filename ? `--filename ${filename}` : ""}`
      )
      return stdout === value.toString()
    },
    async run(vars) {
      const { filename, key, value } = vars
      await $(
        `sshd-config set ${key} ${value} ${
          filename ? `--filename ${filename}` : ""
        }`,
        {
          sudo: true,
        }
      )
    },
  })
