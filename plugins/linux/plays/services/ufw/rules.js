const isEqual = require("lodash/isEqual")
const defaults = require("lodash/defaults")
const cloneDeep = require("lodash/cloneDeep")
const camelCase = require("lodash/camelCase")
const omit = require("lodash/omit")

const ipaddr = require("ipaddr.js")
const { default: matrixExpand } = require("matrix-expand")

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

  const fromIpIsNull = (rule) => {
    const { fromIp, fromIpPrefix } = rule
    return (
      fromIpPrefix === "0" &&
      (fromIp === null || fromIp === "0.0.0.0" || fromIp === "::")
    )
  }

  const toIpIsNull = (rule) => {
    const { toIp, toIpPrefix } = rule
    return (
      toIpPrefix === "0" &&
      (toIp === null || toIp === "0.0.0.0" || toIp === "::")
    )
  }

  const preSortRules = (a, b) => {
    if (a.networkProtocol !== b.networkProtocol) {
      return a.networkProtocol === "ipv6" ? 1 : -1
    }
    return 0
  }
  const sortRules = (a, b) => {
    return a.index - b.index
  }

  const rulesIndexByNetworkProtocol = (rules) => {
    const map = { ipv4: {}, ipv6: {} }
    let ipv4Index = 0
    let ipv6Index = 0
    for (const rule of rules) {
      const { networkProtocol, index } = rule
      map[networkProtocol][index] =
        networkProtocol === "ipv6" ? ++ipv6Index : ++ipv4Index
    }
    return map
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
      networkProtocol: "both",
      toInterface: null,
      toTransport: null,
      toService: null,
      toPortRanges: null,
      toPorts: null,
      toIp: null,
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
    if (fromIpIsNull(rule)) {
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
    if (!Array.isArray(rules)) {
      rules = Object.entries(rules).reduce((acc, [k, v]) => {
        acc.push({
          comment: k,
          ...v,
        })
        return acc
      }, [])
    }

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
      } = rule

      const matrix = {}
      const proto = isFrom({ direction, route }) ? fromTransport : toTransport
      if (
        !proto &&
        (fromPortRanges ||
          toPortRanges ||
          fromPorts?.length > 1 ||
          toPorts?.length > 1)
      ) {
        matrix.transport = [
          {
            fromTransport: isFrom({ direction, route }) ? "tcp" : null,
            toTransport: !isFrom({ direction, route }) ? "tcp" : null,
          },
          {
            fromTransport: isFrom({ direction, route }) ? "udp" : null,
            toTransport: !isFrom({ direction, route }) ? "udp" : null,
          },
        ]
      }

      if (rule.networkProtocol === "both") {
        const { fromIp, toIp } = rule

        const hasFromIp = !fromIpIsNull(rule)
        const hasToIp = !toIpIsNull(rule)
        if (hasFromIp || hasToIp) {
          const ipInferSrc = hasFromIp ? fromIp : toIp
          const addr = ipaddr.parse(ipInferSrc)
          rule.networkProtocol = addr.kind() === "ipv6" ? "ipv6" : "ipv4"
        } else {
          matrix.networkProtocol = ["ipv4", "ipv6"]
        }
      }

      const expanded = matrixExpand(matrix)

      const addingRules = expanded.map(({ networkProtocol, transport }) => {
        return {
          ...rule,
          ...(networkProtocol ? { networkProtocol } : {}),
          ...(transport
            ? {
                fromTransport: transport.fromTransport,
                toTransport: transport.toTransport,
              }
            : {}),
        }
      })

      for (const r of addingRules) {
        // if (fromIpIsNull(r)) {
        //   r.fromIp = r.networkProtocol === "ipv6" ? "::" : "0.0.0.0"
        // }
        if (toIpIsNull(r)) {
          r.toIp = r.networkProtocol === "ipv6" ? "::" : "0.0.0.0"
        }
      }

      newRules.push(...addingRules)
    }

    newRules = newRules.map((rule) => objectSortKeys(rule))

    newRules = newRules.sort(preSortRules)
    newRules = newRules.map(({ index, ...rule }, i) => ({
      ...rule,
      index: index !== null ? index : i + 1,
    }))
    newRules = newRules.sort(sortRules)

    return newRules
  }

  const getActualRules = async () => {
    let { rules } = await loaders.services.ufw({ type: "numbered" })
    rules = normalizeRules(rules)
    return rules
  }

  return createPlay(async (vars) => {
    let { rules } = vars
    rules = normalizeRules(rules)

    const { removeUnlistedRules = false } = vars

    const cleanRules = async () => {
      const actualRules = await getActualRules()
      for (const actualRule of actualRules.reverse()) {
        const rule = rules.find((r) => ruleEqual(actualRule, r))
        if (!rule) {
          await $(`ufw --force delete ${actualRule.index}`, { sudo: true })
        }
      }
    }

    const insertRules = async () => {
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

        const { networkProtocol } = rule
        const actualRulesByIndexProtocol =
          rulesIndexByNetworkProtocol(actualRules)
        let index = actualRulesByIndexProtocol[networkProtocol][rule.index]
        if (index === undefined) {
          index = actualRulesByIndexProtocol[networkProtocol].length
        }
        // dbug({ "rule.index": rule.index, index })

        const insert =
          index <= actualRulesByIndexProtocol[networkProtocol].length
            ? `insert ${index}`
            : ""

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

    return {
      async check(_vars, _common, { isPostCheck }) {
        const logger = ctx.getLogger()

        const actualRules = await getActualRules()

        // dbug({ actualRules }).k()
        // dbug({ rules }).k()

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
      async run() {
        if (removeUnlistedRules) {
          await cleanRules()
        }

        await insertRules()
      },
    }
  })
}

// allow|deny|reject|limit [in|out [on INTERFACE]] [log|log-all] [proto PROTOCOL] [from ADDRESS [port PORT | app APPNAME ]] [to ADDRESS [port PORT | app APPNAME ]] [comment COMMENT]
