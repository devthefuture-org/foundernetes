const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs-extra")
const shellQuote = require("shell-quote")
const extractBin = require("@foundernetes/std/extract-bin")

module.exports = async (args) => {
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

  // Find the chart path, which is typically the second non-flag argument
  const nonFlagArgs = args.filter((arg) => !arg.startsWith("-"))
  if (nonFlagArgs.length < 2) {
    throw new Error("Chart path not found in arguments")
  }
  const chartPath = nonFlagArgs.length > 2 ? nonFlagArgs[2] : nonFlagArgs[1]

  if (!fs.existsSync(chartPath)) {
    throw new Error(`Chart path does not exist: ${chartPath}`)
  }

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

      args.push("--values", valuesJsonPath)
    } catch (error) {
      console.error("Error executing values file:", error)
      throw error
    }
  }

  const postRendererPath = `${chartPath}/post-renderer`
  if (fs.existsSync(postRendererPath)) {
    args.push("--post-renderer", postRendererPath)
  }

  const helmCommand = `helm ${shellQuote.quote(args)}`
  process.stderr.write(`executing helm command: ${helmCommand}\n`)
  execSync(helmCommand, { stdio: "inherit" })
}
