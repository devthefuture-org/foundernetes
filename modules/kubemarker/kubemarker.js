const fs = require("fs/promises")
const path = require("path")
const { execa } = require("@foundernetes/execa")
const { yaml } = require("@foundernetes/std")
const { Command, Option } = require("commander")

const program = new Command()

const createLogger = require("@foundernetes/std/logger-factory")

const subKindToSubKeyMap = {
  pod: "spec.template",
  job: "spec.jobTemplate",
  "cronjob.pod": "spec.jobTemplate.spec.template",
}

// this is needed by node SEA to allow requiring external plugins
// eslint-disable-next-line import/order
const { createRequire } = require("node:module")
// eslint-disable-next-line no-global-assign
require = createRequire(__filename)

const resourceCache = new Map()
const manifestCache = new Map()

async function patchMetadata(
  namespace,
  resourceType,
  resourceName,
  metadataType,
  keyValuePairs,
  dryRun,
  logger
) {
  if (Object.keys(keyValuePairs).length === 0) {
    return
  }

  const patch = {}
  const metadataPath =
    metadataType === "labels" ? "metadata.labels" : "metadata.annotations"
  const keys = metadataPath.split(".")
  let current = patch
  while (keys.length > 1) {
    const key = keys.shift()
    current[key] = current[key] || {}
    current = current[key]
  }
  current[keys[0]] = keyValuePairs

  const patchJson = JSON.stringify(patch)

  if (dryRun) {
    logger.info(
      `Dry run would patch ${metadataType} on ${resourceType}/${resourceName} in namespace ${namespace} with: ${patchJson}`
    )
    return
  }

  try {
    await execa("kubectl", [
      "patch",
      resourceType,
      resourceName,
      "-n",
      namespace,
      "--type=merge",
      "-p",
      patchJson,
    ])
    logger.info(
      `Patched ${metadataType} on ${resourceType}/${resourceName} in namespace ${namespace} with: ${patchJson}`
    )
  } catch (error) {
    logger.error(
      `Failed to patch ${metadataType} on ${resourceType}/${resourceName} in namespace ${namespace}`,
      { errorMessage: error.toString() }
    )
    throw error
  }
}

async function getResourceTypeKindMap(logger) {
  try {
    const { stdout } = await execa("kubectl", [
      "api-resources",
      "--verbs=list",
      "--namespaced",
      "-o",
      "wide",
    ])
    const lines = stdout.split("\n").slice(1) // skip the header
    const map = {}
    for (const line of lines) {
      const [name, , , , kind] = line.split(/\s+/)
      if (name && kind) {
        map[kind.toLowerCase()] = name
      }
    }
    return map
  } catch (error) {
    logger.error("Failed to get resource types and kinds", {
      errorMessage: error.toString(),
    })
    return {}
  }
}

async function getResources(namespace, resourceType) {
  const cacheKey = `${namespace}:${resourceType}`
  if (resourceCache.has(cacheKey)) {
    return resourceCache.get(cacheKey)
  }
  try {
    const { stdout } = await execa("kubectl", [
      "get",
      resourceType,
      "-n",
      namespace,
      "-o",
      "jsonpath={.items[*].metadata.name}",
    ])
    const resources = stdout.split(" ").filter(Boolean)
    resourceCache.set(cacheKey, resources)
    return resources
  } catch (error) {
    throw new Error(
      `Failed to get resources of type ${resourceType} in namespace ${namespace}: ${error.message}`
    )
  }
}

async function getResourceManifest(namespace, resourceType, resourceName) {
  const cacheKey = `${namespace}:${resourceType}:${resourceName}`
  if (manifestCache.has(cacheKey)) {
    return manifestCache.get(cacheKey)
  }
  try {
    const { stdout } = await execa("kubectl", [
      "get",
      resourceType,
      resourceName,
      "-n",
      namespace,
      "-o",
      "yaml",
    ])
    const manifest = yaml.loadObject(stdout)
    manifestCache.set(cacheKey, manifest)
    return manifest
  } catch (error) {
    throw new Error(
      `Failed to get manifest of ${resourceType}/${resourceName} in namespace ${namespace}: ${error.message}`
    )
  }
}

function expandDotNotation(obj, dotKey, value) {
  const keys = dotKey.split(".")
  let current = obj

  while (keys.length > 1) {
    const key = keys.shift()
    current[key] = current[key] || {}
    current = current[key]
  }

  current[keys[0]] = value
  return obj
}

async function patchMetadataToSubresources(
  namespace,
  resourceType,
  resourceName,
  subKey,
  labels,
  annotations,
  dryRun,
  logger
) {
  const patch = {}

  if (labels) {
    expandDotNotation(patch, `${subKey}.metadata.labels`, labels)
  }
  if (annotations) {
    expandDotNotation(patch, `${subKey}.metadata.annotations`, annotations)
  }

  const patchJson = JSON.stringify(patch)

  if (dryRun) {
    logger.info(
      `Dry run would patch subresource on ${namespace}/${resourceType}/${resourceName} with: ${patchJson}`
    )
    return
  }

  try {
    await execa("kubectl", [
      "patch",
      resourceType,
      resourceName,
      "-n",
      namespace,
      "--type=merge",
      "-p",
      patchJson,
    ])
    logger.info(
      `Patched subresource on ${namespace}/${resourceType}/${resourceName} with: ${patchJson}`
    )
  } catch (error) {
    logger.error(
      `Failed to patch subresource on ${namespace}/${resourceType}/${resourceName}`,
      { errorMessage: error.toString() }
    )
  }
}

function unpluralize(resourceType) {
  if (resourceType.endsWith("ies")) {
    return `${resourceType.slice(0, -3)}y`
  }
  if (resourceType.endsWith("ves")) {
    return `${resourceType.slice(0, -3)}f`
  }
  if (resourceType.endsWith("s") && !resourceType.endsWith("ss")) {
    return resourceType.slice(0, -1)
  }
  return resourceType
}

function parseResourceDescriptor(descriptor) {
  const parts = descriptor.split("/")
  if (parts.length === 3) {
    return { apiGroup: parts[0], kind: parts[1], name: parts[2] }
  }
  if (parts.length === 2) {
    return parts[0].includes(".")
      ? { apiGroup: parts[0], kind: parts[1] }
      : { kind: parts[0], name: parts[1] }
  }
  if (parts.length === 1) {
    return { kind: parts[0] }
  }
  return {}
}

function shouldIncludeResource(
  includeResources,
  resourceType,
  resourceName,
  apiGroup = ""
) {
  if (!includeResources) return true
  const kind = unpluralize(resourceType)
  for (const include of includeResources) {
    const {
      apiGroup: includeApiGroup,
      kind: includeKind,
      name: includeName,
    } = parseResourceDescriptor(include)
    if (
      includeKind.toLowerCase() === kind &&
      (!includeApiGroup || includeApiGroup === apiGroup) &&
      (!includeName || includeName === resourceName)
    ) {
      return true
    }
  }
  return false
}

function shouldExcludeResource(
  excludeResources,
  resourceType,
  resourceName,
  apiGroup = ""
) {
  const kind = unpluralize(resourceType)
  for (const exclude of excludeResources) {
    const {
      apiGroup: excludeApiGroup,
      kind: excludeKind,
      name: excludeName,
    } = parseResourceDescriptor(exclude)

    if (
      excludeKind.toLowerCase() === kind &&
      (!excludeApiGroup || excludeApiGroup === apiGroup) &&
      (!excludeName || excludeName === resourceName)
    ) {
      return true
    }
  }
  return false
}

async function loadAndRunPlugins(plugins, context, logger) {
  for (const { name, options } of plugins) {
    const pluginPath = path.resolve(process.cwd(), ".kubemarker", `${name}.js`)
    try {
      const plugin = require(pluginPath)
      const result = await plugin(context, options, logger)
      if (typeof result === "object") {
        Object.assign(context, result)
      } else if (result === false) {
        context.excluded = true
      }
    } catch (error) {
      logger.error(`Failed to load or run plugin ${name}`, { error })
      throw error
    }
    if (context.excluded) {
      break
    }
  }
}

async function main({ config: configFile, dryRun, logLevel }) {
  const logger = createLogger({
    logLevel,
  })
  try {
    const configFileContent = await fs.readFile(configFile, "utf8")
    const config = yaml.loadObject(configFileContent)
    const { defaultLabels = {}, defaultAnnotations = {} } = config
    const {
      strategy,
      exclude: globalExclude = [],
      include: globalInclude = [],
    } = config

    const resourceTypeKindMap = await getResourceTypeKindMap(logger)

    for (const {
      namespace,
      labels = defaultLabels,
      annotations = defaultAnnotations,
      subKind,
      subKey,
      include,
      exclude = [],
      plugins = [],
    } of strategy) {
      logger.info(`Processing namespace: ${namespace}`)

      if (include) {
        include.push(...globalInclude)
      }
      exclude.push(...globalExclude)

      const subKindNormalized = subKind.toLowerCase()

      // Apply labels and annotations to other resources
      for (const kind of Object.keys(resourceTypeKindMap)) {
        const resourceType = resourceTypeKindMap[kind]
        const resolvedSubKey =
          subKey ||
          (subKindNormalized === "pod" && resourceType === "cronjob"
            ? subKindToSubKeyMap["cronjob.pod"]
            : subKindToSubKeyMap[subKindNormalized])

        const resources = await getResources(namespace, resourceType)
        for (const resource of resources) {
          if (!shouldIncludeResource(include, resourceType, resource, "")) {
            logger.debug(`Skipping resource not included: ${kind}/${resource}`)
            continue
          }
          if (shouldExcludeResource(exclude, resourceType, resource, "")) {
            logger.debug(`Skipping excluded resource: ${kind}/${resource}`)
            continue
          }

          const manifest = await getResourceManifest(
            namespace,
            resourceType,
            resource
          )

          const context = {
            namespace,
            resourceType,
            resource,
            labels,
            annotations,
            subKind: subKindNormalized,
            subKey: resolvedSubKey,
            excluded: false,
            manifest,
          }

          await loadAndRunPlugins(plugins, context, logger)

          if (context.excluded) {
            logger.debug(
              `Skipping excluded resource by plugins: ${kind}/${resource}`
            )
            continue
          }

          if (context.subKey) {
            await patchMetadataToSubresources(
              namespace,
              resourceType,
              resource,
              context.subKey,
              context.labels,
              context.annotations,
              dryRun,
              logger
            )
          } else {
            if (context.labels) {
              await patchMetadata(
                namespace,
                resourceType,
                resource,
                "labels",
                context.labels,
                dryRun,
                logger
              )
            }
            if (context.annotations) {
              await patchMetadata(
                namespace,
                resourceType,
                resource,
                "annotations",
                context.annotations,
                dryRun,
                logger
              )
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("Failed to apply labels and annotations", {
      errorMessage: error.toString(),
    })
    throw error
  }
}

const CONFIG_FILE = process.env.KUBEMARKER_CONFIG_FILE || "kubemarker.yaml"

program
  .version(require(`./package.json`).version)
  .description(
    "Label and annotate resources in Kubernetes namespaces based on a strategy defined in a YAML configuration file"
  )
  .option("-c, --config <path>", "path to the configuration file", CONFIG_FILE)
  .option("--dry-run", "perform a dry run without making any changes", false)
  .addOption(
    new Option("-l, --log-level <level>", "set the log level")
      .choices(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info")
  )
  .action((options) => {
    main(options)
  })

program.parse(process.argv)
