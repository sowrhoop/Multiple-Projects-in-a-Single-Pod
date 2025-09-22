# Runpod Mimic: Two Projects in One Pod

This repo demonstrates two ways to run two different projects (each with its own Dockerfile) inside a single Runpod pod:

- Option A: Single container image that runs both processes via Supervisor (works on any Runpod Pod).
- Option B: Two separate containers orchestrated by Docker Compose (works if your Mimic setup allows multi-container pods or Docker-in-Docker).

## Layout

- `services/service-a` — Python FastAPI on port 8000
- `services/service-b` — Node.js Express on port 3000
- `Dockerfile.supervisor` — Single image that runs both services together
- `supervisord.conf` — Process manager config
- `compose.yaml` — Multi-container option for environments that allow Compose

## Build and test locally

Single image with both services:

```sh
docker build -f Dockerfile.supervisor -t your-username/two-in-one:latest .
docker run --rm -p 8000:8000 -p 3000:3000 your-username/two-in-one:latest
# Test
curl http://localhost:8000/
curl http://localhost:3000/
```

Compose (two containers locally):

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

# Separate service images (if using Compose or Mimic multi-container)
docker build -t your-username/service-a:latest services/service-a
docker push your-username/service-a:latest
docker build -t your-username/service-b:latest services/service-b
docker push your-username/service-b:latest
```

## Run on Runpod

### Option A — Single container (recommended)

1. In Runpod, create a Pod Template.
2. Set Container Image to `your-username/two-in-one:latest` (built from `Dockerfile.supervisor`).
3. Expose ports `8000` and `3000` in the template (so you can reach both services).
4. Launch the pod; both services start under Supervisor.

Notes:
- If you need GPU libraries, base your image on an NVIDIA CUDA or Runpod base and install Python/Node accordingly.
- Supervisor restarts services on crash and streams logs to stdout/stderr.

### Option B — Mimic with multiple containers

If your Runpod Mimic environment supports running multiple containers in a single pod:

1. Build and push both images: `your-username/service-a:latest` and `your-username/service-b:latest`.
2. In Mimic, add both containers to the pod (or import `compose.yaml` if supported).
3. Map ports `8000` and `3000` and, if needed, attach a shared volume to `/shared` for both.
4. If GPUs are required, ensure each container requests GPU resources.

If Mimic does not support multi-container pods in your account, fall back to Option A.

## Services

- Python FastAPI (Service A): `services/service-a` (Dockerfile exposes `8000`)
- Node Express (Service B): `services/service-b` (Dockerfile exposes `3000`)

Both expose simple health endpoints at `/` returning JSON.

