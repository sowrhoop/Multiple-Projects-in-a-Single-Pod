# Runpod: Two Projects in One Pod

This repo lets you run two different projects together on Runpod. A Runpod Pod runs one container image, so to run both services inside a single Pod we use a combined image that starts both processes under Supervisor. You can also run each service in its own Pod if you prefer.

## Layout

- `services/service-a` — Python FastAPI on port 8000
- `services/service-b` — Node.js Express on port 3000
- `Dockerfile.supervisor` — Combined image that runs both services
- `supervisord.conf` — Process manager config for the combined image
- `compose.yaml` — Optional (for local dev only)

## Build and Test Locally

Combined image with both services (recommended for Runpod):

```sh
docker build -f Dockerfile.supervisor -t your-username/two-in-one:latest .
docker run --rm -p 8000:8000 -p 3000:3000 your-username/two-in-one:latest
# Test
curl http://localhost:8000/
curl http://localhost:3000/
```

Compose (optional for local dev):

```sh
docker compose up --build
# Test
curl http://localhost:8000/
curl http://localhost:3000/
```

## Pushing Images

```sh
# Single combined image (manual push alternative to CI)
docker push your-username/two-in-one:latest

# Separate service images (for running as two Pods)
DOCKER_USER=your-username ./scripts/build_and_push.sh
# or on Windows PowerShell:
./scripts/build_and_push.ps1 -DockerUser your-username
```

### Use GitHub (GHCR) or Docker Hub tokens

Do not use your GitHub password or Docker Hub web password with `docker login`. Use tokens:

- Docker Hub: create an Access Token (Account Settings → Security → New Access Token), then:
  - PowerShell: `$env:REGISTRY_TOKEN='...'; $env:REGISTRY_USER='your-dockerhub-user'; ./scripts/build_and_push.ps1`
  - Bash: `REGISTRY_TOKEN=... REGISTRY_USER=your-dockerhub-user ./scripts/build_and_push.sh`

- GitHub Container Registry (ghcr.io): create a GitHub Personal Access Token with `write:packages` and `read:packages` scopes, then:
  - PowerShell:
    - `$env:REGISTRY_HOST='ghcr.io'`
    - `$env:REGISTRY_USER='your-github-username'`
    - `$env:REGISTRY_TOKEN='YOUR_GHCR_PAT'`
    - `./scripts/build_and_push.ps1`
  - Bash:
    - `REGISTRY_HOST=ghcr.io REGISTRY_USER=your-github-username REGISTRY_TOKEN=YOUR_GHCR_PAT ./scripts/build_and_push.sh`

The scripts log in non-interactively using `--password-stdin` and tag images as:

- Docker Hub: `your-dockerhub-user/service-a:latest`, `.../service-b:latest`
- GHCR: `ghcr.io/your-github-username/service-a:latest`, `.../service-b:latest`

## Run on Runpod

Runpod Pods run a single container image. To run both services together in one Pod, use the combined Supervisor image. Alternatively, run each service in its own Pod.

### Option A: Single Pod, Single Image (Supervisor)

1. Use the CI workflow to build and push `ghcr.io/<owner>/two-in-one:latest`.
2. Create a Pod Template with image `ghcr.io/<owner>/two-in-one:latest`.
3. Expose ports 8000 and 3000.
4. Optional env to change ports: `SERVICE_A_PORT`, `SERVICE_B_PORT`.
5. Launch and test both endpoints.

### Option B: Two Pods (one per service)

1. Use images `ghcr.io/<owner>/service-a:latest` and `ghcr.io/<owner>/service-b:latest`.
2. Create two Pod Templates and expose 8000 and 3000 respectively.
3. For service-to-service calls across Pods, use Public Endpoints (or Runpod networking features, if enabled for your account).

## Services

- Python FastAPI (Service A): `services/service-a` (Dockerfile exposes `8000`)
- Node Express (Service B): `services/service-b` (Dockerfile exposes `3000`)

Both expose simple health endpoints at `/` returning JSON.

## CI Option: Build and Push without Docker Desktop (GHCR)

Use GitHub Actions to build and push images to GitHub Container Registry (no WSL needed):

- Workflow: `.github/workflows/build-and-push.yml` (GHCR only)
- Trigger: manual (`workflow_dispatch`)
- Registry: GHCR (`ghcr.io`) using the built-in `GITHUB_TOKEN` (no extra secret required)

Run the workflow (Actions tab → Build and Push Images (GHCR)). Resulting tags:

- GHCR: `ghcr.io/<org-or-user>/service-a:latest`, `...:sha-<shortsha>` and same for `service-b`.
- GHCR (combined): `ghcr.io/<org-or-user>/two-in-one:latest`, `...:sha-<shortsha>`.

Use these image names in your Runpod Pod Template.

Note: This workflow does not push to Docker Hub. If you also want Docker Hub pushes, I can add a separate workflow file.

### CI Smoke Tests

The workflow first builds the images locally on the runner and runs both containers (and also the combined Supervisor image), curling `/` on ports 8000/3000 (or remapped ports for the combined). Only if this passes do pushes occur. Logs are printed on failure for quick diagnosis.

Local smoke tests (optional):

```sh
# If you have Docker locally
docker build -t local/service-a:ci services/service-a && docker run -d --rm -p 8000:8000 --name svc-a local/service-a:ci
docker build -t local/service-b:ci services/service-b && docker run -d --rm -p 3000:3000 --name svc-b local/service-b:ci

./scripts/smoke-test.sh

docker rm -f svc-a svc-b
```

## Combined Image in One Container

Build and push manually (optional alternative to CI):

```sh
docker build -f Dockerfile.supervisor -t ghcr.io/<owner>/two-in-one:latest .
docker push ghcr.io/<owner>/two-in-one:latest
```

Then set the Pod Template image to `ghcr.io/<owner>/two-in-one:latest` and expose `8000` and `3000`.

## Extras: Ports, Healthchecks, GPU

- Ports via Supervisor: you can set `SERVICE_A_PORT` and `SERVICE_B_PORT` env vars on the single-image (Supervisor) container to change default ports (8000/3000). `supervisord.conf` reads these at runtime.
- Healthchecks: `compose.yaml` and `compose.images.yaml` include HTTP healthchecks on `/`. They require `curl`, which is installed in both service images.
- GPU images: for single-image (Supervisor) usage, GPU-enabled alternatives are provided:
  - `Dockerfile.supervisor.gpu` (monorepo)
  - `Dockerfile.supervisor.multirepo.gpu` (multi-repo)
  - `services/service-a/Dockerfile.gpu` (if Service A needs CUDA runtime)
  Use these only if you need GPU libraries inside the container.

