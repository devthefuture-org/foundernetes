const get = require("lodash.get")

const runContextCommand = require("~/process/run-context-command")
const loadInputPayload = require("~/process/load-input-payload")

const createContextPlaybook = require("~/playbook/create-context-playbook")

const options = require("../options")

module.exports = (program) =>
  program
    .command("play")
    .description("run play with payload")
    .addOption(options.cwd)
    .addOption(options.gracefullShutdownTimeout)
    .addOption(options.defaultPlayRetry)
    .addOption(options.tags)
    .addOption(options.skipTags)
    .addOption(options.playbook)
    .addOption(options.payload)
    .argument("<playName>", "play name (support dot notation)")
    .action(async (playName, opts, _command) => {
      const input = await loadInputPayload(opts.I)

      const processCallback = async (playbooks) => {
        const [playbook] = playbooks
        const { definition, plays } = playbook
        const playbookCallback = async () => {
          const play = get(plays, playName)
          await play(input)
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
