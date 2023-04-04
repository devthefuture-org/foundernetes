const os = require("os")
const path = require("path")
const { mkdtemp } = require("fs/promises")
const untildify = require("untildify")
const fs = require("fs-extra")
const parseDuration = require("parse-duration")

const loadStructuredConfig = require("~/utils/load-structured-config")

const syncDir = require("~/lib/sync-dir")

const envParserCastArray = require("./env-parsers/cast-array")
const envParserYaml = require("./env-parsers/yaml")

module.exports = async (opts = {}, inlineConfigs = [], env = process.env) => {
  const rootConfigStructure = {
    cwd: {
      env: "F10S_CWD",
      option: "cwd",
      default: process.cwd(),
    },
    projectName: {
      defaultFunction: (config) => path.basename(config.cwd),
    },
  }

  const rootConfig = await loadStructuredConfig({
    inlineConfigs,
    configStructure: rootConfigStructure,
    options: opts,
    env,
  })

  const configStructure = {
    playbooksDir: {
      env: "F10S_PLAYBOOKS_DIR",
      default: "playbooks",
    },
    gracefullShutdownTimeout: {
      option: "gracefull-shutdown-timeout",
      env: "F10S_GRACEFULL_SHUTDOWN_TIMEOUT",
      default: "30s",
    },
    gracefullShutdownTimeoutMs: {
      defaultFunction: (config) =>
        parseDuration(config.gracefullShutdownTimeout),
    },
    defaultPlayRetry: {
      option: "default-play-retry",
      env: "F10S_DEFAULT_PLAY_RETRY",
      envParser: envParserYaml,
      default: 0,
    },
    sudoPassword: {
      env: "F10S_SUDO_PASSWORD",
    },
    sudoAskPassword: {
      env: "F10S_SUDO_ASK_PASSWORD",
      defaultFunction: (config) => !!config.sudo && !config.sudoPassword,
    },
    sudo: {
      env: "F10S_SUDO",
      envParser: envParserYaml,
      defaultFunction: (config) => !!config.sudoPassword,
    },
    execLogStd: {
      env: "F10S_EXEC_LOG_STD",
      envParser: envParserYaml,
      default: true,
    },
    execLogCommands: {
      env: "F10S_EXEC_LOG_COMMANDS",
      envParser: envParserYaml,
      default: true,
    },
    execEnv: {
      default: {},
    },
    execEnforceLeastPrivilege: {
      default: true,
    },
    execEnforceLeastPrivilegeUseGoSu: {
      default: false,
    },
    extraPaths: {
      default: [],
      sideEffect: (extraPaths) => {
        process.env.PATH = [...extraPaths, process.env.PATH].join(
          path.delimiter
        )
      },
    },
    extractBinPath: {
      default: {
        source: "/snapshot/foundation/bin",
        target: "~/.foundernetes/bin",
      },
      sideEffect: async (extractBinPath) => {
        const { source } = extractBinPath
        if (!(await fs.pathExists(source))) {
          return
        }
        const target = untildify(extractBinPath.target)
        await syncDir(source, target)
        process.env.PATH = [target, process.env.PATH].join(path.delimiter)
      },
    },
    logFile: {
      env: "F10S_LOG_FILE",
    },
    logFilePlain: {
      env: "F10S_LOG_FILE_PLAIN",
      default: true,
      envParser: envParserYaml,
    },
    tmpRootPath: {
      env: "F10S_TMP_ROOT_PATH",
      defaultFunction: () => path.join(os.tmpdir(), "foundernetes"),
      sideEffect: async (tmpRootPath) => {
        await fs.ensureDir(tmpRootPath)
      },
    },
    tmpDir: {
      env: "F10S_TMP_PATH",
      defaultFunction: (config) =>
        mkdtemp(path.join(config.tmpRootPath, `${config.projectName}-`)),
      keepDefault: true,
    },
    tags: {
      env: "F10S_TAGS",
      option: "T",
      optionParser: envParserCastArray,
      envParser: envParserCastArray,
      default: null,
      transform: (tags) => {
        if (!tags) {
          return tags
        }
        return [
          ...tags.flatMap((tag) => {
            const parts = tag.split(":")
            const newTags = []
            while (parts.length) {
              newTags.push([...parts].join(":"))
              parts.pop()
            }
            return newTags
          }),
        ]
      },
    },
    skipTags: {
      env: "F10S_SKIP_TAGS",
      option: "E",
      optionParser: envParserCastArray,
      envParser: envParserCastArray,
      default: null,
      transform: (tags) => {
        if (!tags) {
          return tags
        }
        return [...tags, ...tags.map((tag) => `${tag}:*`)]
      },
    },
  }

  const { cwd } = rootConfig
  const config = await loadStructuredConfig({
    name: "foundernetes",
    cwd,
    rootConfig,
    inlineConfigs,
    configStructure,
    options: opts,
    env,
  })
  return config
}
