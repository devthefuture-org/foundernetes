const dbug = require("@foundernetes/dbug")
const yaml = require("@foundernetes/std/yaml")
const async = require("@foundernetes/async")
const ctx = require("@foundernetes/ctx")
const cli = require("~/cli")

const createIterator = require("~/iterator/create")

const createTree = require("~/tree/create")

const createLoader = require("~/loader/create")
const createPlay = require("~/play/create")
const createComposer = require("~/composer/create")
const createPlaybook = require("~/playbook/create")

const loader = require("~/loader/short")
const play = require("~/play/short")

const validate = require("~/vars/validate")
const createValidator = require("~/vars/create-validator")

const sudoFactory = require("~/lib/sudo-factory")
const sudoAskPassword = require("~/lib/sudo-ask-password")
const execa = require("~/lib/execa")

const config = require("~/config")

const FoundernetesPlayCheckError = require("~/error/play-check")
const FoundernetesPlayPreCheckError = require("~/error/play-pre-check")
const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

const breakpoint = require("~/breakpoint")

module.exports = {
  cli,

  // factories
  createIterator,
  createLoader,
  createPlay,
  createComposer,
  createPlaybook,
  createTree,

  // shorts (useful in snippets or simple workflows)
  loader,
  play,

  // vars
  createValidator,
  validate,

  // breakpoint
  breakpoint,

  // context
  ctx,

  // errors
  FoundernetesPlayCheckError,
  FoundernetesPlayPreCheckError,
  FoundernetesPlayPostCheckError,

  // utils
  yaml,

  // lib
  sudoFactory,
  sudoAskPassword,
  $: execa,
  async,

  // dev
  dbug,

  // config
  config,
}
