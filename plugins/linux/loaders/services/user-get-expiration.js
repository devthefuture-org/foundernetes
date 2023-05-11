const os = require("os")

const { createLoader, $ } = require("@foundernetes/blueprint")

module.exports = () => {
  return createLoader({
    load: async (vars = {}) => {
      let { user } = vars
      if (user === undefined || user === null) {
        const userInfos = await os.userInfo()
        user = userInfos.username
      }
      const { stdout } = await $(`chage --list ${user}`)

      let data = stdout.split("\n")
      data = {
        changed: new Date(data[0].split(": ")[1]),
        passwordExpires:
          data[1].split(": ")[1] === "never"
            ? null
            : new Date(data[1].split(": ")[1]),
        inactive:
          data[2].split(": ")[1] === "never"
            ? null
            : new Date(data[2].split(": ")[1]),
        accountExpires:
          data[3].split(": ")[1] === "never"
            ? null
            : new Date(data[3].split(": ")[1]),
        minDays: Number(data[4].split(": ")[1]),
        maxDays: Number(data[5].split(": ")[1]),
        warnDays: Number(data[6].split(": ")[1]),
      }
      return data
    },
  })
}
