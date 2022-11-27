ARG UBUNTU_VERSION=22.04

FROM ubuntu:$UBUNTU_VERSION as downloader
RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    curl \
    ca-certificates \
    wget \
    git \
  && rm -rf /var/lib/apt/lists/*

FROM ubuntu:$UBUNTU_VERSION as node
ARG NODE_VERSION=18
ENV NODE_VERSION=$NODE_VERSION
RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    ca-certificates \
    git \
    libgraph-easy-perl \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && \
  apt-get install -yq --no-install-recommends \
    wget \
    && wget -qO- https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM node as packages
COPY --chown=1001:1001 package.json yarn.lock .yarnrc.yml ./
COPY --chown=1001:1001 .yarn .yarn

# Keep yarn install cache when bumping version and dependencies still the sames
RUN node -e " \
  const package = JSON.parse(fs.readFileSync('package.json')); \
  const packageZero = { ...package, version: '0.0.0' };  \
  fs.writeFileSync('package.json', JSON.stringify(packageZero));"

FROM node as cli

RUN groupadd -g 1001 ubuntu && useradd -rm -d /home/ubuntu -s /bin/bash -g ubuntu -G sudo -u 1001 ubuntu
RUN mkdir -p /opt && chown 1001:1001 /opt

RUN mkdir -p /workspace && chown 1001:1001 /workspace
RUN mkdir -p /opt/foundernetes && chown 1001:1001 /opt/foundernetes

RUN mkdir /yarn
RUN chown 1001:1001 /yarn
ENV YARN_CACHE_FOLDER /yarn

ENV HOME=/home/ubuntu
RUN chmod a+rw $HOME
RUN git config --global --add safe.directory /workspace
RUN mkdir $HOME/.kube

ENV F10S_EXTERNAL_BIN_FORCE_DOWNLOAD "false"

ENTRYPOINT ["/opt/foundernetes/bin/foundernetes"]
CMD ["help"]

USER 1001

WORKDIR /opt/foundernetes

COPY --from=packages --chown=1001:1001 /app/package.json ./package.json
COPY --from=packages --chown=1001:1001 /app/yarn.lock ./yarn.lock
COPY --from=packages --chown=1001:1001 /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=packages --chown=1001:1001 /app/.yarn ./.yarn

RUN yarn --immutable --production && yarn cache clean

COPY --chown=1001:1001 . .

WORKDIR /workspace