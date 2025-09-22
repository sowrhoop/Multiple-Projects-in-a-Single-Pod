#!/usr/bin/env bash
set -euo pipefail

DOCKER_USER=${DOCKER_USER:-}
if [[ -z "$DOCKER_USER" ]]; then
  echo "Set DOCKER_USER env var to your Docker Hub username" >&2
  exit 1
fi

echo "Building and pushing $DOCKER_USER/service-a:latest"
docker build -t "$DOCKER_USER/service-a:latest" services/service-a
docker push "$DOCKER_USER/service-a:latest"

echo "Building and pushing $DOCKER_USER/service-b:latest"
docker build -t "$DOCKER_USER/service-b:latest" services/service-b
docker push "$DOCKER_USER/service-b:latest"

echo "Done. Use these images in your Runpod Pod Template."

