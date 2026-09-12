# Extends the official Arcan 2 CLI trial image (Java 18 + the arcan.sh CLI
# already unzipped into /arcan) with git (needed to clone target repos) and
# a small zero-dependency Node HTTP server that queues and runs scans.
# See https://github.com/Arcan-Tech/arcan-2-cli-trial for the base image.
FROM ghcr.io/arcan-tech/arcan-2-cli-trial:latest

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY index.js ./index.js

ENV ARCAN_HOME=/arcan
ENV ARCAN_SCRIPT=./arcan.sh
ENV WORK_ROOT=/data/arcan-jobs
ENV PORT=8080

EXPOSE 8080
ENTRYPOINT ["node", "/app/index.js"]
