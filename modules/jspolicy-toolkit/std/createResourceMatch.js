module.exports = function createResourceMatch(req) {
  return ({
    namespace,
    name,
    kind,
    group,
    apiGroup = group,
    version,
    apiVersion = version,
    resource,
  }) => {
    return (
      req.namespace === namespace &&
      req.name === name &&
      (!kind || req.kind.kind === kind) &&
      (!resource || req.resource.resource === resource) &&
      (!apiGroup || req.kind.group === apiGroup) &&
      (!apiVersion || req.kind.version === apiVersion)
    )
  }
}
