const dayjs = require("dayjs")

module.exports = async (_payload, context) => {
  const { require: req } = context

  const fs = req("fs-extra")
  const ctx = req("@foundernetes/ctx")
  const { play } = req("@foundernetes/blueprint")

  const logger = ctx.getLogger()

  logger.info(`It's ${dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")}`)

  const file = "hello.txt"
  const expected = "Hello World !"
  await play({
    name: "hello-world",
    check: async () => {
      if (!(await fs.pathExists(file))) {
        return false
      }
      const current = await fs.readFile(file, { encoding: "utf-8" })
      return current === expected
    },
    run: async () => {
      await fs.writeFile(file, expected)
    },
  })
}
