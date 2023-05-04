const { createLoader, $ } = require("@foundernetes/blueprint")

module.exports = () => {
  return createLoader({
    load: async () => {
      const { stdout } = await $("cat /etc/shadow", {
        sudo: true,
        logStdout: false,
        stripFinalNewline: false,
      })
      const passwords = stdout
        .split("\n")
        .filter((line) => {
          return line.length > 0 && line[0] !== "#"
        })
        .map((user) => {
          const fields = user.split(":")
          return {
            username: fields[0],
            password: fields[1],
            lastChange: fields[2],
            passwordExpires: fields[3],
            passwordInactive: fields[4],
            accountExpires: fields[5],
            minDays: fields[6],
            maxDays: fields[7],
            warnDays: fields[8],
          }
        })
      return passwords
    },
  })
}
