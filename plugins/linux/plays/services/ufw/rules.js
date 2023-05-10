const isEqual = require("lodash/isEqual")
const defaults = require("lodash/defaults")
const cloneDeep = require("lodash/cloneDeep")
const camelCase = require("lodash/camelCase")
const omit = require("lodash/omit")
const ctx = require("@foundernetes/ctx")
const castInt = require("@foundernetes/std/cast-int")
const { createPlay, $ } = require("@foundernetes/blueprint")

const traverse = require("@foundernetes/std/traverse")
const objectSortKeys = require("@foundernetes/std/object-sort-keys")

const ruleEqual = (a, b) => {
  a = omit(a, ["index"])
  b = omit(b, ["index"])
  return isEqual(a, b)
}

module.exports = async ({ loaders }) => {
  const keyMap = {
    actionDirection: "direction",
  }

  const normalizeRule = (rule) => {
    rule = cloneDeep(rule)
    rule = traverse(rule, (o) => {
      if (typeof o !== "object" || o === null || Array.isArray(o)) {
        return o
      }
      for (const [k, val] of Object.entries(o)) {
        delete o[k]
        o[camelCase(k)] = val
      }
      return o
    })
    rule = Object.entries(rule).reduce((acc, [k, v]) => {
      k = keyMap[k] || k
      acc[k] = v
      return acc
    }, {})
    rule = defaults(rule, {
      action: "allow",
      direction: "in",
      networkProtocol: "ipv4",
      toInterface: null,
      toTransport: null,
      toService: null,
      toPortRanges: null,
      toPorts: null,
      toIp: "0.0.0.0",
      toIpPrefix: "0",
      comment: null,
      fromIp: null,
      fromIpPrefix: "0",
      fromInterface: null,
      fromTransport: null,
      fromPortRanges: null,
      fromPorts: null,
      fromService: null,
      index: null,
      route: false,
    })
    rule = traverse(rule, (val) => {
      if (
        val !== undefined &&
        val !== null &&
        typeof val !== "object" &&
        typeof val !== "boolean"
      ) {
        val = val.toString()
        val = val.toLowerCase()
      }
      return val
    })
    if (
      rule.fromPortRanges?.length === 1 &&
      rule.fromPortRanges[0].start === "0"
    ) {
      rule.fromPortRanges = null
    }
    if (rule.toPortRanges?.length === 1 && rule.toPortRanges[0].start === "0") {
      rule.toPortRanges = null
    }
    rule.index = castInt(rule.index)
    if (rule.fromService) {
      rule.fromPorts = null
      rule.fromPortRanges = null
      if (rule.fromService.startsWith("(") && rule.fromService.endsWith(")")) {
        rule.fromService = null
      }
    }
    if (rule.fromTransport === "any") {
      rule.fromTransport = null
    }
    if (rule.toTransport === "any") {
      rule.toTransport = null
    }
    if (rule.fromIp === "0.0.0.0" && rule.fromIpPrefix === "0") {
      rule.fromIp = null
    }

    if (rule.fromInterface === "any") {
      rule.fromInterface = null
    }

    if (rule.toInterface === "any") {
      rule.toInterface = null
    }

    return rule
  }

  const isFrom = ({ direction, route }) => {
    const incoming = direction !== "out"
    if (route) {
      return incoming
    }
    return !incoming
  }

  const normalizeRules = (rules) => {
    rules = rules.filter((rule) => rule.enabled !== false)
    rules = rules.map(normalizeRule)
    let newRules = []
    for (const rule of rules) {
      let { direction } = rule
      if (direction === "fwd") {
        if (rule.fromInterface !== null) {
          direction = "in"
        } else {
          direction = "out"
        }
        rule.route = true
        rule.direction = direction
      }
      const { route } = rule

      const uniDirectionalKeys = [
        "interface",
        "ip",
        "ipPrefix",
        "transport",
        "ports",
        "portRanges",
        "service",
      ]
      for (const key of uniDirectionalKeys) {
        if (!rule[key]) {
          continue
        }
        const prefix = isFrom({ direction, route }) ? "from" : "to"
        const mapKey = camelCase(`${prefix}-${key}`)
        rule[mapKey] = rule[key]
        delete rule[key]
      }

      const {
        fromTransport,
        toTransport,
        fromPorts,
        toPorts,
        toPortRanges,
        fromPortRanges,
        // fromInterface,
      } = rule

      const proto = isFrom({ direction, route }) ? fromTransport : toTransport
      if (
        !proto &&
        (fromPortRanges ||
          toPortRanges ||
          fromPorts?.length > 1 ||
          toPorts?.length > 1)
      ) {
        newRules.push({
          ...rule,
          fromTransport: isFrom({ direction, route }) ? "tcp" : null,
          toTransport: !isFrom({ direction, route }) ? "tcp" : null,
        })
        newRules.push({
          ...rule,
          fromTransport: isFrom({ direction, route }) ? "udp" : null,
          toTransport: !isFrom({ direction, route }) ? "udp" : null,
        })
      } else {
        newRules.push(rule)
      }
    }

    newRules = newRules.map((rule) => objectSortKeys(rule))

    newRules = newRules.map(({ index, ...rule }, i) => ({
      ...rule,
      index: index !== null ? index : i + 1,
    }))
    newRules = newRules.sort((a, b) => a.index - b.index)

    return newRules
  }

  const getActualRules = async () => {
    let { rules } = await loaders.services.ufw({ type: "numbered" })
    rules = normalizeRules(rules)
    return rules
  }

  const insertRules = async ({ rules }) => {
    let actualRules = await getActualRules()

    for (const rule of rules) {
      const {
        action,
        route,
        direction,
        toInterface,
        toTransport,
        toIp,
        toIpPrefix,
        toPorts,
        toPortRanges,
        toService,
        comment,
        fromIp,
        fromIpPrefix,
        fromInterface,
        fromTransport,
        fromPorts,
        fromPortRanges,
        fromService,
        index,
      } = rule

      const actualRule = actualRules.find((r) => ruleEqual(rule, r))
      if (actualRule && rule.index !== actualRule.index) {
        await $(`ufw --force delete ${actualRule.index}`, { sudo: true })
        actualRules = await getActualRules()
      }

      const interface = isFrom({ direction, route })
        ? fromInterface
        : toInterface

      const fromPort = fromPorts
        ? `port ${fromPorts.join(",")}`
        : fromPortRanges
        ? `${
            fromPortRanges
              ? `port ${fromPortRanges
                  .map(({ start, end }) =>
                    [start === "0" ? "1" : start, end].join(":")
                  )
                  .join(",")}`
              : ""
          }`
        : ""

      const toPort = toPorts
        ? `port ${toPorts.join(",")}`
        : toPortRanges
        ? `${
            toPortRanges
              ? `port ${toPortRanges
                  .map(({ start, end }) =>
                    [start === "0" ? "1" : start, end].join(":")
                  )
                  .join(",")}`
              : ""
          }`
        : ""

      const proto = isFrom({ direction, route }) ? fromTransport : toTransport
      const service = isFrom({ direction, route }) ? fromService : toService

      const insert = index <= actualRules.length ? `insert ${index}` : ""

      const { stdout } = await $(
        `ufw ${route ? "route" : ""} ${insert} ${action} ${direction} ${
          interface && !service ? `on ${interface}` : ""
        } ${proto && !service ? `proto ${proto}` : ""} ${
          fromIp ? `from ${fromIp}` : ""
        }${fromIp && fromIpPrefix ? `/${fromIpPrefix}` : ""} ${fromPort} ${
          toIp ? `to ${toIp}` : ""
        }${toIp && toIpPrefix ? `/${toIpPrefix}` : ""} ${toPort} ${
          service ? `app ${service}` : ""
        } ${comment ? `comment "${comment.replaceAll('"', '\\"')}"` : ""}`,
        { sudo: true }
      )
      if (!stdout.includes("Skipping")) {
        actualRules = await getActualRules()
      }
    }
  }

  const cleanRules = async ({ rules }) => {
    const actualRules = await getActualRules()
    for (const actualRule of actualRules) {
      const rule = rules.find((r) => ruleEqual(actualRule, r))
      if (!rule) {
        await $(`ufw --force delete ${actualRule.index}`, { sudo: true })
      }
    }
  }

  return createPlay({
    async check(vars, { isPostCheck }) {
      const logger = ctx.getLogger()

      let { rules } = vars
      rules = normalizeRules(rules)

      const actualRules = await getActualRules()

      // dbug({ actualRules })
      // dbug({ rules })

      const { removeUnlistedRules = false } = vars
      if (removeUnlistedRules) {
        for (const actualRule of actualRules) {
          if (!rules.some((rule) => ruleEqual(actualRule, rule))) {
            logger.debug("an unexpected rule was found", {
              rule: actualRule,
              ...(isPostCheck ? { expectedRules: rules } : {}),
            })
            return false
          }
        }
      }

      let lastFoundIndex = 0
      for (const rule of rules) {
        let found = false
        let actualIndex = lastFoundIndex
        for (const actualRule of actualRules.slice(lastFoundIndex)) {
          if (ruleEqual(rule, actualRule)) {
            if (actualIndex < lastFoundIndex) {
              logger.debug("rule is missing or is not ordered as expected", {
                rule,
              })
              return false
            }
            found = true
            lastFoundIndex = actualIndex
            break
          }
          actualIndex++
        }
        if (!found) {
          logger.debug("rule is missing or is not ordered as expected", {
            rule,
          })
          return false
        }
      }

      return true
    },
    async run(vars) {
      let { rules } = vars
      rules = normalizeRules(rules)

      const { removeUnlistedRules = false } = vars
      if (removeUnlistedRules) {
        await cleanRules({ rules })
      }

      await insertRules({ rules })
    },
  })
}

// allow|deny|reject|limit [in|out [on INTERFACE]] [log|log-all] [proto PROTOCOL] [from ADDRESS [port PORT | app APPNAME ]] [to ADDRESS [port PORT | app APPNAME ]] [comment COMMENT]
