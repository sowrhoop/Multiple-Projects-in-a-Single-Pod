# Runpod: Two Services in One Pod (Supervisor)

This repo packages two independent projects into a single Docker image and runs them concurrently in one Runpod.io pod using Supervisord.

- Project 1 (FastAPI): listens on port 8080
- Project 2 (Express): listens on port 9090

## Layout

- `services/service-a` — Python FastAPI app
- `services/service-b` — Node.js Express app
- `Dockerfile.supervisor` — Combined image that contains both apps
- `supervisord.conf` — Process manager config (starts both apps)
- `.github/workflows/build-and-push.yml` — CI to build/push the combined image
- `scripts/` — Optional helpers to build/push per‑service images

## Build and test locally

Combined image with both services:

```sh
# Build combined image
docker build -f Dockerfile.supervisor -t your-username/two-services:latest .

# Run and expose both services
docker run --rm -p 8080:8080 -p 9090:9090 your-username/two-services:latest

# Test
curl http://localhost:8080/
curl http://localhost:9090/
```

## CI: Build and push to GHCR

The workflow builds and pushes the combined image to GitHub Container Registry (GHCR) using the built-in `GITHUB_TOKEN`.

- Trigger: push to `main`/`master` (affected paths) or manual dispatch.
- Resulting tags:
  - `ghcr.io/<owner>/two-services:latest`
  - `ghcr.io/<owner>/two-services:${GITHUB_SHA}`

Workflow file: `.github/workflows/build-and-push.yml`

## Run on Runpod (Single Pod, Single Image)

- Image: `your-username/two-services:latest` (or `ghcr.io/<owner>/two-services:latest` if using GHCR)
- Expose ports: `8080` and `9090` (you can override via env: `SERVICE_A_PORT`, `SERVICE_B_PORT` — they must be different)
- Optional: SSH into the pod and manage processes independently with supervisorctl:
  - `supervisorctl status`
  - `supervisorctl restart project1`
  - `supervisorctl restart project2`

## Notes

- The two services are isolated processes; if one crashes, Supervisord auto‑restarts it without impacting the other.
- Inter‑process communication (if needed) is over `localhost` via their ports.
- If you still want two separate containers (one per service) instead of a combined image, you can use the individual service Dockerfiles in `services/` and deploy them as two pods.

### Health & Port Enforcement

The combined image defines a Docker `HEALTHCHECK` that pings both endpoints:
- `http://localhost:${SERVICE_A_PORT:-8080}/`
- `http://localhost:${SERVICE_B_PORT:-9090}/`
If either is down, the container is marked unhealthy.

The container entrypoint enforces unique ports and exits with an error if `SERVICE_A_PORT` equals `SERVICE_B_PORT`.

### Isolation Hardening

- Separate UNIX users per service in the combined image (`svc_a`, `svc_b`) with directory ownership restricted (chmod 750) so services cannot read each other’s code/data.
- Each standalone service image also runs as a non‑root user by default.
- For extra isolation at runtime, consider running the container with a read‑only root filesystem and explicit writable dirs:

  ```sh
  docker run --rm \
    --read-only \
    -v svc_a_tmp:/home/svc_a \
    -v svc_b_tmp:/home/svc_b \
    -p 8080:8080 -p 9090:9090 \
    ghcr.io/<owner>/two-services:latest
  ```

  On Runpod, mount persistent volumes to the same paths as writable homes if your apps need to write.
