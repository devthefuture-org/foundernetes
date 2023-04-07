const dbug = require("~/dbug")
const cli = require("~/cli")

const async = require("~/lib/async")
const createIterator = require("~/iterator/create")

const createTree = require("~/tree/create")

const createLoader = require("~/loader/create")
const createPlay = require("~/play/create")
const createComposer = require("~/composer/create")
const createPlaybook = require("~/playbook/create")

const validate = require("~/vars/validate")
const createValidator = require("~/vars/create-validator")

const yaml = require("~/utils/yaml")

const sudoFactory = require("~/lib/sudo-factory")
const sudoAskPassword = require("~/lib/sudo-ask-password")
const execa = require("~/lib/execa")

const ctx = require("~/ctx")

const FoundernetesPlayCheckError = require("~/error/play-check")
const FoundernetesPlayPreCheckError = require("~/error/play-pre-check")
const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

module.exports = {
  cli,

  // factories
  createIterator,
  createLoader,
  createPlay,
  createComposer,
  createPlaybook,
  createTree,

  // vars
  createValidator,
  validate,

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
  execa,
  $: execa,
  async,

  // dev
  dbug,
}
