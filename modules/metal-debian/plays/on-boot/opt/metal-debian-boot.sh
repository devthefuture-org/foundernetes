#!/bin/bash
set -e
cd /opt/metal-debian
export F10S_LOG_LEVEL=trace
export F10S_LOG_FILE=/var/log/metal-debian/boot-$(date '+%Y-%m-%d-%H-%M-%S').log
export F10S_LOG_FILE_PLAIN=/var/log/metal-debian/plain.boot-$(date '+%Y-%m-%d-%H-%M-%S').log
export FORCE_COLOR=2
exec ./metal-debian