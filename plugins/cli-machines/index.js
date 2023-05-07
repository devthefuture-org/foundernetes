const path = require("path")
const fs = require("fs/promises")

const ctx = require("@foundernetes/ctx")
const yaml = require("@foundernetes/std/yaml")
const loadStructuredConfig = require("@foundernetes/std/load-structured-config")
const envParserCastArray = require("@foundernetes/std/env-parsers/cast-array")
// const envParserYaml = require("@foundernetes/std/env-parsers/yaml")
const machines = require("@foundernetes/machines")

module.exports = (params = {}) => {
  const {
    cwd: defaultCwd = "~/.foundernetes/machines",
    extraUpload = [],
    extraCommands = [],
  } = params

  return {
    config: async (config, options) => {
      const configStructure = {
        machinesConfig: {
          option: "machinesConfig",
          env: "F10S_MACHINES_CONFIG",
        },
        machinesCwd: {
          option: "machinesCwd",
          env: "F10S_MACHINES_CWD",
        },
        machinesUpload: {
          option: "machineUpload",
          env: "F10S_MACHINES_UPLOAD",
          envParser: envParserCastArray,
        },
        machines: {
          option: "machines",
          env: "F10S_MACHINES",
        },
      }
      const extendsConfig = await loadStructuredConfig({
        configStructure,
        options,
      })
      return { ...config, ...extendsConfig }
    },
    commands: {
      playbook: async (command, factory) => {
        const { action } = factory
        command
          .option(
            "--machines",
            "enable upload and execute a playbook on remote machines"
          )
          .option(
            "--machines-config <file>",
            "upload and execute a playbook on remote machines",
            "machines.yaml"
          )
          .option(
            "--machines-cwd <dir>",
            "working directory for machines",
            defaultCwd
          )
          .option(
            "--machines-upload <file...>",
            "upload a file on machines, can be used multiple times"
          )
          .action(async (targets, opts, cmd) => {
            const config = ctx.getConfig()
            if (!config.machines) {
              await action(targets, opts, cmd)
              return
            }

            const { machinesCwd, machinesUpload = [], machinesConfig } = config
            const machinesYaml = await fs.readFile(machinesConfig, {
              encoding: "utf-8",
            })

            const inventory = yaml.loadObject(machinesYaml)
            if (!inventory.hosts) {
              inventory.hosts = []
            }
            if (!inventory.commands) {
              inventory.commands = []
            }
            if (!inventory.files) {
              inventory.files = []
            }
            if (!inventory.ssh) {
              inventory.ssh = {}
            }

            const machinesDefinition = {
              inventory: {
                ...inventory,
                ssh: {
                  ...inventory.ssh,
                  ...(machinesCwd ? { cwd: machinesCwd } : {}),
                },
                files: [
                  ...inventory.files,
                  ...extraUpload,
                  ...machinesUpload.map((f) => {
                    return {
                      source: f,
                      target: `${machinesCwd}/${path.basename(f)}`,
                    }
                  }),
                ],
                commands: [...inventory.commands, ...extraCommands],
              },
            }

            await machines(machinesDefinition)
          })
      },
    },
  }
}
