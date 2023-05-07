const path = require("path")
const { randomUUID } = require("node:crypto")
const { PassThrough } = require("stream")
const { setTimeout } = require("timers/promises")

const fs = require("fs-extra")

const shellQuote = require("shell-quote")
const untildify = require("@foundernetes/std/untildify")
const detectTild = require("@foundernetes/std/detect-tild")
const ctx = require("@foundernetes/ctx")
const { NodeSSH } = require("node-ssh")
const Deferred = require("@foundernetes/std/deferred")

const sshSudoDetectPasswordNeeded = require("./ssh-sudo-detect-password-needed")

module.exports = async (options = {}) => {
  const logger = ctx.getLogger()

  const ssh = new NodeSSH()
  const {
    address,
    user,
    password,
    tryKeyboard = true,
    sudoPassword = password,
    sudoPasswordNeeded: sudoPasswordNeededDefault,
    sudoPasswordDetectNeeded: sudoPasswordDetectNeededDefault = true,
    sudoPasswordLessAfterTimeout: sudoPasswordLessAfterTimeoutDefault = true,
    env: defaultCommandEnv = {},
  } = options

  const { agent = process.env.SSH_AUTH_SOCK } = options

  const { keyPassword } = options
  let { keyPath } = options
  if (keyPath) {
    keyPath = untildify(keyPath)
  } else if (!agent) {
    const defaultKeyPath = untildify("~/.ssh/id_rsa")
    if (await fs.pathExists(defaultKeyPath)) {
      keyPath = defaultKeyPath
    }
  }

  let sudoPrompt = `[sudo][${randomUUID()}] password: `
  sudoPrompt = sudoPrompt.trim()

  let { port } = options
  if (!Array.isArray(port)) {
    port = [port]
  }

  for (const p of port) {
    try {
      logger.info(`📡 connecting to ${user}@${address}:${p}...`)
      await ssh.connect({
        host: address,
        username: user,
        port: p,
        privateKeyPath: keyPath,
        passphrase: keyPassword,
        agent,
        password,
        tryKeyboard,
      })
      logger.info(`🤝 connected ${user}@${address}:${p}`)
      break
    } catch (err) {
      if (err.code !== "ECONNREFUSED") {
        throw err
      }
    }
  }

  let { cwd } = options
  const { untildifyCwd = true } = options
  if (cwd && untildifyCwd && detectTild(cwd)) {
    let { home } = options
    if (!home) {
      const { detectHome = true } = options
      if (detectHome) {
        const { stdout } = await ssh.execCommand("echo $HOME")
        home = stdout
      }
      if (!home) {
        home = `/home/${user}`
      }
    }
    cwd = untildify(cwd, home)
  }

  // wrap commands with cwd and env
  const execCommand = ssh.execCommand.bind(ssh)
  ssh.execCommand = (givenCommand, commandOptions = {}) => {
    const { env = {}, ...opts } = commandOptions

    if (cwd && !opts.cwd) {
      opts.cwd = cwd
    }

    const commandEnv = { ...defaultCommandEnv, ...env }
    const commandEnvEntries = Object.entries(commandEnv)
    if (commandEnvEntries.length > 0) {
      const envPrefix = commandEnvEntries
        .map(([key, val]) => {
          key = shellQuote.quote([key])
          val = shellQuote.quote([val])
          return `${key}=${val}`
        })
        .join(" ")
      givenCommand = [envPrefix, givenCommand].join(" ")
    }

    return execCommand(givenCommand, opts)
  }

  const mkdir = ssh.mkdir.bind(ssh)
  ssh.mkdir = (dir, method, givenSftp) => {
    if (cwd && !dir.startsWith("/")) {
      dir = path.join(cwd, dir)
    }
    return mkdir(dir, method, givenSftp)
  }

  const getFile = ssh.getFile.bind(ssh)
  ssh.getFile = (localFile, remoteFile, givenSftp) => {
    if (cwd && !remoteFile.startsWith("/")) {
      remoteFile = path.join(cwd, remoteFile)
    }
    return getFile(localFile, remoteFile, givenSftp)
  }

  const putFile = ssh.putFile.bind(ssh)
  ssh.putFile = (localFile, remoteFile, givenSftp) => {
    if (cwd && !remoteFile.startsWith("/")) {
      remoteFile = path.join(cwd, remoteFile)
    }
    return putFile(localFile, remoteFile, givenSftp)
  }

  const putFiles = ssh.putFiles.bind(ssh)
  ssh.putFiles = (files, opts) => {
    if (cwd) {
      files = files.map(({ local, remote }) => {
        if (!remote.startsWith("/")) {
          remote = path.join(cwd, remote)
        }
        return { local, remote }
      })
    }
    return putFiles(files, opts)
  }

  const putDirectory = ssh.putDirectory.bind(ssh)
  ssh.putDirectory = (localDirectory, remoteDirectory, opts) => {
    if (cwd && !remoteDirectory.startsWith("/")) {
      remoteDirectory = path.join(cwd, remoteDirectory)
    }
    return putDirectory(localDirectory, remoteDirectory, opts)
  }

  const getDirectory = ssh.getDirectory.bind(ssh)
  ssh.getDirectory = (localDirectory, remoteDirectory, opts) => {
    if (cwd && !remoteDirectory.startsWith("/")) {
      remoteDirectory = path.join(cwd, remoteDirectory)
    }
    return getDirectory(localDirectory, remoteDirectory, opts)
  }

  // extra command sudo
  ssh.execCommandSudo = async (command, opts = {}) => {
    const {
      preserveEnv = true,
      user: impersonateUser,
      group: impersonateGroup,
      sudoPassword: sudoPasswordLocal = sudoPassword,
      sudoPasswordNeeded = sudoPasswordNeededDefault,
      sudoPasswordDetectNeeded = sudoPasswordDetectNeededDefault,
      sudoPasswordLessAfterTimeout = sudoPasswordLessAfterTimeoutDefault,
      ...commandOptions
    } = opts

    if (!Array.isArray(command)) {
      command = shellQuote.parse(command)
    }

    command = [
      ...command.splice(0, 1),
      "-S",
      ...(preserveEnv ? ["-E"] : []),
      ...(impersonateUser !== undefined ? ["-u", impersonateUser] : []),
      ...(impersonateGroup !== undefined ? ["-g", impersonateGroup] : []),
      "-k",
      "-p",
      sudoPrompt,
      ...command,
    ]
    command = shellQuote.quote(command)

    const stdin = new PassThrough()

    let prompted = 0
    const passwordTyped = new Deferred()

    const promise = ssh.execCommand(command, {
      ...commandOptions,
      onStderr: (chunk) => {
        const lines = chunk.toString().trim().split("\n")
        if (lines.some((line) => line === sudoPrompt)) {
          if (prompted > 0) {
            throw new Error("incorrect password")
          }
          prompted += 1
          stdin.write(`${sudoPasswordLocal}\n`)
          passwordTyped.resolve()
          chunk = sudoPrompt.replace(sudoPrompt, "")
        }
        if (commandOptions.onStderr) {
          return commandOptions.onStderr(chunk)
        }
      },
      stdin,
    })

    let passwordNeeded = sudoPasswordNeeded
    if (passwordNeeded === undefined) {
      if (sudoPasswordDetectNeeded) {
        passwordNeeded = await sshSudoDetectPasswordNeeded(ssh)
      } else {
        passwordNeeded = !!sudoPasswordLocal
      }
    }
    if (passwordNeeded) {
      if (sudoPasswordLessAfterTimeout) {
        await Promise.race([passwordTyped.promise, setTimeout(2000)])
      } else {
        await passwordTyped.promise
      }
    }
    if (commandOptions.stdin) {
      if (typeof commandOptions.stdin === "string") {
        stdin.write(commandOptions.stdin)
        stdin.end()
      } else {
        commandOptions.stdin.pipe(stdin)
      }
    }

    return promise
  }

  return ssh
}
