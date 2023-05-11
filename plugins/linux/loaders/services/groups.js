const fs = require("fs-extra")

const { createLoader } = require("@foundernetes/blueprint")

module.exports = () => {
  return createLoader({
    load: async () => {
      const groupsConfig = await fs.readFile("/etc/group", {
        encoding: "utf-8",
      })
      const groups = groupsConfig
        .split("\n")
        .filter((group) => {
          return group.length > 0 && group[0] !== "#"
        })
        .map((group) => {
          const fields = group.split(":")
          return {
            groupname: fields[0],
            password: fields[1],
            gid: fields[2],
            members: fields[3] ? fields[3].split(",") : [],
          }
        })
      return groups
    },
  })
}
