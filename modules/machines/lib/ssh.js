const path = require("path")
const { randomUUID } = require("node:crypto")
const { PassThrough } = require("stream")
const { setTimeout } = require("timers/promises")

const shellQuote = require("shell-quote")
const untildify = require("untildify")
const { NodeSSH } = require("node-ssh")
const Deferred = require("@foundernetes/std/deferred")

const sshSudoDetectPasswordNeeded = require("./ssh-sudo-detect-password-needed")

module.exports = async (options = {}) => {
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
    cwd,
  } = options

  let { keyPath } = options
  if (keyPath) {
    keyPath = untildify(keyPath)
  }

  let sudoPrompt = `[sudo][${randomUUID()}] password: `
  sudoPrompt = sudoPrompt.trim()

  let { port } = options
  if (!Array.isArray(port)) {
    port = [port]
  }

  for (const p of port) {
    try {
      await ssh.connect({
        host: address,
        username: user,
        port: p,
        privateKeyPath: keyPath,
        password,
        tryKeyboard,
      })
      break
    } catch (err) {
      if (err.code !== "ECONNREFUSED") {
        throw err
      }
    }
  }

  // wrap commands with cwd
  const execCommand = ssh.execCommand.bind(ssh)
  ssh.execCommand = (givenCommand, opts = {}) => {
    if (cwd && !opts.cwd) {
      opts = { ...opts, cwd }
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
      preserveEnv,
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
