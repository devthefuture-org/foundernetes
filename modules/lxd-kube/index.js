const machines = require("@foundernetes/machines")

const main = async () => {
  await machines({
    inventory: {
      // files: [],
      // ssh: {},
      // commands: [],
      // hosts: [],
    },
  })
  process.exit()
}

main()
