const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs-extra")
const shellQuote = require("shell-quote")
const extractBin = require("@foundernetes/std/extract-bin")

const compatibleCommands = ["template", "install", "upgrade"]

module.exports = async () => {
  const isDist = await fs.pathExists("/snapshot")
  const distBinDirs = () => [
    "/snapshot/modules/helmix/bin",
    "/snapshot/modules/sniper/dist-bin",
  ]
  const devBinDirs = () => {
    const devBinRoot = path.resolve(path.dirname(process.argv[1]), "..", "..")
    return [
      `${devBinRoot}/modules/helmix/bin`,
      `${devBinRoot}/modules/sniper/dist-bin`,
    ]
  }
  const extractBinPath = isDist ? distBinDirs() : devBinDirs()

  await extractBin(extractBinPath, { pathUpdateMode: "prepend" })

  const args = process.argv.slice(2)

  // Find the chart path, which is typically the second non-flag argument
  let chartPath = null
  for (const arg of args) {
    if (!arg.startsWith("-")) {
      chartPath = arg
    } else {
      break
    }
  }

  const [command] = args
  if (compatibleCommands.includes(command)) {
    const valuesFilePath = path.join(chartPath, "values")
    if (
      fs.existsSync(valuesFilePath) &&
      // eslint-disable-next-line no-bitwise
      fs.statSync(valuesFilePath).mode & fs.constants.S_IXUSR
    ) {
      try {
        const valuesOutput = execSync(`"${valuesFilePath}"`, {
          encoding: "utf-8",
        })
        const valuesJsonPath = path.join(chartPath, "tmp-values.json")
        fs.writeFileSync(valuesJsonPath, valuesOutput)

        args.push(`--values=${valuesJsonPath}`)
      } catch (error) {
        console.error("error executing values file:", error)
        throw error
      }
    }

    const postRendererPath = `${chartPath}/post-renderer`
    if (fs.existsSync(postRendererPath)) {
      args.push(`--post-renderer=${postRendererPath}`)
    }
  }

  const helmCommand = `helm ${shellQuote.quote(args)}`
  process.stderr.write(`executing: ${helmCommand}\n`)
  execSync(helmCommand, { stdio: "inherit" })
}
