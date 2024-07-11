# KubeMarker

KubeMarker is a CLI tool for labeling and annotating resources in Kubernetes namespaces based on a strategy defined in a YAML configuration file. It also supports plugins for custom logic implementation.

## Features

- Label and annotate resources in Kubernetes namespaces.
- Define labeling and annotation strategy in a YAML configuration file.
- Support for include and exclude resource filters.
- Support for plugins to implement custom logic.
- Dry-run mode for testing without making changes.
- Configurable log levels.

## Installation

Ensure you have Node.js 20 or higher installed.

Install dependencies:

```bash
yarn
```

## Usage

### Configuration File

Create a `kubemarker.yaml` file with the following structure:

```yaml
defaultLabels:
  backup: default-value
defaultAnnotations:
  backupAnnotation: default-value
strategy:
  - namespace: my-ns1
    labels:
      backup: custom-value-1
    annotations:
      backupAnnotation: custom-value-1
    subKind: pod
    include:
      - myApiGroup/Pod
      - myOtherApiGroup/Deployment/myResourceName
    exclude:
      - myCrd1
      - myCrd2ApiGroup/myCrd2
    plugins:
      - name: postgres
        options:
          pgpassword: gitea
  - namespace: my-ns2
    labels:
      backup: custom-value-2
    annotations:
      backupAnnotation: custom-value-2
    subKind: pod
    include:
      - anotherApiGroup/anotherKind
    exclude:
      - myCrd3ApiGroup/myCrd3/nameOfTheResource
      - myCrd4/kind
```

### Command Line Interface

```bash
Usage: kubemarker [options]

Label and annotate resources in Kubernetes namespaces based on a strategy defined in a YAML configuration file

Options:
  -V, --version              output the version number
  -c, --config <path>        path to the configuration file (default: "kubemarker.yaml")
  --dry-run                  perform a dry run without making any changes
  -l, --log-level <level>    set the log level (choices: "fatal", "error", "warn", "info", "debug", "trace") (default: "info")
  -h, --help                 display help for command
```

### Examples

Perform a dry run:

```bash
node kubemarker.js --config path/to/kubemarker.yaml --dry-run --log-level debug
```

Apply labels and annotations:

```bash
node kubemarker.js --config path/to/kubemarker.yaml --log-level info
```

### Environment Variables

* `KUBEMARKER_CONFIG_FILE`: Path to the configuration file. Defaults to `kubemarker.yaml`.

### Log Levels

* `fatal`
* `error`
* `warn`
* `info`
* `debug`
* `trace`

## Plugins

KubeMarker supports plugins to extend its functionality. Each plugin is a CommonJS module located in the `.kubemarker` directory and exports a function that receives the context, options, and logger as arguments.

### Example Plugin (postgres.js)

Create a file named `postgres.js` in the `.kubemarker` directory with the following content:

```javascript
module.exports = async function (context, options, logger) {
  logger.info(
    `Running postgres plugin for resource ${context.resource} in namespace ${
      context.namespace
    }`
  )

  const {
    pghost = '127.0.0.1',
    pgport = '5432',
    pguser = 'postgres',
    pgpassword = pguser,
    backupLabelName = "velero_backup",
  } = options

  const preCommand = `
    export PGHOST=${pghost};
    export PGPORT=${pgport};
    export PGUSER=${pguser};
    export PGPASSWORD=${pgpassword};
    psql -c \"SELECT pg_backup_start('${backupLabelName}');\"
  `
  const postCommand = `
    export PGHOST=${pghost};
    export PGPORT=${pgport};
    export PGUSER=${pguser};
    export PGPASSWORD=${pgpassword};
    psql -c \"SELECT pg_backup_stop();\"
  `
  
  Object.assign(context.annotations, {
    "backup.velero.io/backup-volumes": "data",
    "pre.hook.backup.velero.io/container": "postgresql",
    "pre.hook.backup.velero.io/command": JSON.stringify(["/bin/sh", "-c", preCommand]),
    "pre.hook.backup.velero.io/on-error": "Fail",
    "post.hook.backup.velero.io/container": "postgresql",
    "post.hook.backup.velero.io/command": JSON.stringify(["/bin/sh", "-c", postCommand]),
    "post.hook.backup.velero.io/on-error": "Fail",
  })

}
```

### Running with Plugins

Ensure your `kubemarker.yaml` configuration includes the plugin definition:

```yaml
strategy:
  - namespace: forgejo
    plugins:
      - name: postgres
        options:
          pgpassword: gitea
    include:
      - StatefulSet/forgejo-postgresql
    subKind: Pod
    
  - namespace: forgejo
    annotations:
      backup.velero.io/backup-volumes: "data"
    include:
      - Deployment/forgejo
    subKind: Pod
```

## Development

### Prerequisites

* Node.js 20 or higher
* Kubernetes CLI (`kubectl`) configured to access your cluster

### Running the Executable

```bash
./kubemarker --config path/to/kubemarker.yaml --log-level info
```

## License

MIT License
