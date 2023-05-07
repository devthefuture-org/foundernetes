const fs = require("fs-extra")
const ini = require("ini")

const { createPlay } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) => {
  return createPlay((vars = {}) => {
    const { file = `/etc/systemd/logind.conf` } = vars
    return {
      async check() {
        const conf = await loaders.std.ini({
          file,
        })
        dbug({ conf: JSON.stringify(conf) })
        return conf.Login?.NAutoVTs === "0" && conf.Login?.ReserveVT === "0"
      },
      async run() {
        const conf = await loaders.std.ini({
          file,
        })
        if (!conf.Login) {
          conf.Login = {}
        }
        conf.Login.NAutoVTs = "0"
        conf.Login.ReserveVT = "0"
        const content = ini.stringify(conf)
        await fs.writeFile(file, content)
      },
    }
  })
}
