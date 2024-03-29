const os = require("os")
const path = require("path")
const { mkdtemp } = require("fs/promises")

const fs = require("fs-extra")
const parseDuration = require("parse-duration")

const untildify = require("@foundernetes/std/untildify")
const loadStructuredConfig = require("@foundernetes/std/load-structured-config")

const envParserCastArray = require("@foundernetes/std/env-parsers/cast-array")
const envParserYaml = require("@foundernetes/std/env-parsers/yaml")
const passwdUser = require("@foundernetes/std/linux/passwd-user")

const extractBin = require("@foundernetes/std/extract-bin")

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
    userDefaultUid: {
      env: "F10S_USER_DEFAULT_UID",
      default: "1000",
    },
    user: {
      env: "F10S_USER",
      defaultFunction: async (config) => {
        const userInfos = await os.userInfo()
        if (userInfos.uid !== 0) {
          return userInfos.username
        }
        if (process.env.SUDO_USER) {
          return process.env.SUDO_USER
        }
        return config.userDefaultUid
      },
      transform: async (user) => passwdUser(user),
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
    addExtraPaths: {
      default: [],
    },
    extraPaths: {
      default: ["/usr/local/bin", "/snap/bin"],
      sideEffect: (extraPaths, config) => {
        process.env.PATH = [
          ...new Set([
            ...extraPaths,
            ...config.addExtraPaths,
            ...process.env.PATH.split(path.delimiter),
          ]),
        ].join(path.delimiter)
      },
    },
    isDist: {
      defaultFunction: async () => {
        return fs.pathExists("/snapshot")
      },
    },
    extractBinPath: {
      default: [],
      sideEffect: async (extractBinPath) => {
        await extractBin(extractBinPath)
      },
    },
    logLevel: {
      env: "F10S_LOG_LEVEL",
      default: "info",
    },
    logDate: {
      env: "F10S_LOG_DATE",
      default: false,
      envParser: envParserYaml,
    },
    logDuration: {
      env: "F10S_LOG_DURATION",
      default: true,
      envParser: envParserYaml,
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
    factsPath: {
      default: "~/.foundernetes/facts",
      transform: async (factsPath, config) => {
        return untildify(factsPath, config.user?.homedir || os.homedir())
      },
    },
    dryRun: {
      default: false,
      option: "dry-run",
      env: "F10S_DRY_RUN",
      envParser: envParserYaml,
    },
    breakpoint: {
      default: false,
      option: "breakpoint",
      env: "F10S_BREAKPOINT",
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
