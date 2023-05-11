const get = require("lodash/get")

const yaml = require("@foundernetes/std/yaml")

const runContextCommand = require("~/process/run-context-command")
const loadInputPayload = require("~/process/load-input-payload")

const createContextPlaybook = require("~/playbook/create-context-playbook")

const options = require("../options")

module.exports = (program) =>
  program
    .command("loader")
    .alias("load")
    .description("run loader with payload")
    .addOption(options.cwd)
    .addOption(options.gracefullShutdownTimeout)
    .addOption(options.defaultPlayRetry)
    .addOption(options.tags)
    .addOption(options.skipTags)
    .addOption(options.playbook)
    .addOption(options.payload)
    .addOption(options.output)
    .argument("<loaderName>", "loader name (support dot notation)")
    .action(async (loaderName, opts, _command) => {
      const input = await loadInputPayload(opts.I)
      const format = opts.O || "yaml"

      const processCallback = async (playbooks) => {
        const [playbook] = playbooks
        const { definition, loaders } = playbook
        const playbookCallback = async () => {
          const loader = get(loaders, loaderName)
          const data = await loader(input)
          let output
          switch (format) {
            case "json": {
              output = JSON.stringify(data)
              break
            }
            case "yaml": {
              output = yaml.dump(data)
              break
            }
            default:
          }
          process.stdout.write(output)
        }
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
