const cli = require("~/cli")

const async = require("~/lib/async")
const createIterator = require("~/iterator/create")
const iteratorFactory = require("~/iterator/factory")

const composeFactory = require("~/compose/factory")

const createPlay = require("~/play/create")
const playFactory = require("~/play/factory")

const createLoader = require("~/loader/create")
const loaderFactory = require("~/loader/factory")

const createPlaybook = require("~/playbook/factory")
const playbookFactory = require("~/playbook/factory")

const validate = require("~/vars/validate")
const createValidator = require("~/vars/create-validator")

const yaml = require("~/utils/yaml")

const sudoFactory = require("~/lib/sudo-factory")
const sudoAskPassword = require("~/lib/sudo-ask-password")
const execa = require("~/lib/execa")
const treeFactory = require("~/lib/tree-factory")

const ctx = require("~/ctx")

const FoundernetesPlayCheckError = require("~/error/play-check")
const FoundernetesPlayPreCheckError = require("~/error/play-pre-check")
const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

module.exports = {
  cli,

  // factories
  createIterator,
  iteratorFactory,
  createPlay,
  playFactory,
  createLoader,
  loaderFactory,
  createPlaybook,
  playbookFactory,
  composeFactory,

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
  treeFactory,
}
