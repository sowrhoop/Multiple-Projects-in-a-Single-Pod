# Runpod: Two Projects in One Single Pod

This repo is prepared to run two different Dockerized projects inside a single Runpod.io pod using two containers in that pod.

## Layout

- `services/service-a` — Python FastAPI on port 8000
- `services/service-b` — Node.js Express on port 3000
- `Dockerfile.supervisor` — Optional single image that runs both services together (fallback)
- `supervisord.conf` — Process manager config (used by the optional single image)
- `compose.yaml` — Optional (for local dev only)

## Build and test locally

Optional single image with both services (fallback):

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

## Pushing images

```sh
# Single image
docker push your-username/two-in-one:latest

# Separate service images (Docker Hub by default)
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

## Run on Runpod (Single Pod, Two Containers)

1. Build and push the two images from this repo:
   - `docker build -t your-username/service-a:latest services/service-a`
   - `docker push your-username/service-a:latest`
   - `docker build -t your-username/service-b:latest services/service-b`
   - `docker push your-username/service-b:latest`

2. In Runpod, create a Pod Template (Single Pod):
   - Add Container 1
     - Image: `your-username/service-a:latest`
     - Expose port: `8000`
     - Environment (optional): `PORT=8000`
   - Add Container 2
     - Image: `your-username/service-b:latest`
     - Expose port: `3000`
     - Environment (optional): `PORT=3000`
   - Optional shared volume: mount to `/shared` in both containers.
   - GPU (if needed): assign the GPU to the pod; both containers will see it.

3. Launch a pod from the template. You’ll get endpoints for each exposed port.

Networking inside the pod: containers share the network namespace; they can talk to each other via `localhost` on their ports (e.g., Service A can call `http://localhost:3000/`).

## Services

- Python FastAPI (Service A): `services/service-a` (Dockerfile exposes `8000`)
- Node Express (Service B): `services/service-b` (Dockerfile exposes `3000`)

Both expose simple health endpoints at `/` returning JSON.

## CI Option: Build and Push without Docker Desktop

Use GitHub Actions to build and push images from the repo (no WSL needed):

- Workflow: `.github/workflows/build-and-push.yml`
- Triggers: manual (`workflow_dispatch`)
- Registries:
  - Docker Hub: set repo secrets `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (Access Token)
  - GHCR: uses the built-in `GITHUB_TOKEN` (no extra secret required)

Run the workflow (Actions tab → Build and Push Images) and choose whether to push to Docker Hub and/or GHCR. Resulting tags:

- Docker Hub: `DOCKERHUB_USERNAME/service-a:latest`, `...:sha-<shortsha>` and same for `service-b`.
- GHCR: `ghcr.io/<org-or-user>/service-a:latest`, `...:sha-<shortsha>` and same for `service-b`.

Use these image names in your Runpod Pod Template.

## Fallback: Single Image in One Container

If your account does not support multi-container pods, use the single-image fallback:

1. Build and push: `docker build -f Dockerfile.supervisor -t your-username/two-in-one:latest . && docker push your-username/two-in-one:latest`
2. In the Pod Template, set image to `your-username/two-in-one:latest` and expose `8000` and `3000`.
3. Launch the pod.

## Extras: Ports, Healthchecks, GPU

- Ports via Supervisor: you can set `SERVICE_A_PORT` and `SERVICE_B_PORT` env vars on the single-image (Supervisor) container to change default ports (8000/3000). `supervisord.conf` reads these at runtime.
- Healthchecks: `compose.yaml` and `compose.images.yaml` include HTTP healthchecks on `/`. They require `curl`, which is installed in both service images.
- GPU images: for single-image (Supervisor) usage, GPU-enabled alternatives are provided:
  - `Dockerfile.supervisor.gpu` (monorepo)
  - `Dockerfile.supervisor.multirepo.gpu` (multi-repo)
  - `services/service-a/Dockerfile.gpu` (if Service A needs CUDA runtime)
  Use these only if you need GPU libraries inside the container. On Runpod, assigning a GPU to the pod exposes it to both containers; Node usually doesn’t require a CUDA base.
