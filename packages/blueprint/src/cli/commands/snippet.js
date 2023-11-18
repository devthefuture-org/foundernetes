const createPlaybook = require("~/playbook/create")

const runContextCommand = require("~/process/run-context-command")
const loadInputPayload = require("~/process/load-input-payload")

const createContextPlaybook = require("~/playbook/create-context-playbook")
const snippetRequire = require("~/snippet/require")

const options = require("../options")

module.exports = (program, projectConfig) =>
  program
    .command("snippet", {
      isDefault: projectConfig.defaultCommand === "snippet",
    })
    .description("run snippet js file")
    .addOption(options.cwd)
    .addOption(options.gracefullShutdownTimeout)
    .addOption(options.defaultPlayRetry)
    .addOption(options.tags)
    .addOption(options.skipTags)
    .addOption(options.playbook)
    .addOption(options.payload)
    .argument("<snippetFile>", "snippet js file (extension is optional)")
    .action(async (snippetFile, opts, _command) => {
      const input = await loadInputPayload(opts.I)
      const snippetPath = snippetFile.startsWith("/")
        ? snippetFile
        : `${process.cwd()}/${snippetFile}`
      const snippet = require(`${snippetPath}`)

      const processCallback = async (playbooks) => {
        const [
          playbook = await createPlaybook({ name: `snippet ${snippetFile}` }),
        ] = playbooks
        const playbookCallback = async () => {
          await snippet(input, {
            playbook,
            require: snippetRequire(projectConfig.requireMap),
          })
        }
        const { definition } = playbook
        const runPlaybook = await createContextPlaybook(
          definition,
          playbookCallback
        )
        await runPlaybook()
      }

      try {
        await runContextCommand({
          targets: opts.playbook || [],
          callback: processCallback,
        })
      } catch (err) {
        if (err === "") {
          return
        }
        throw err
      }
    })
