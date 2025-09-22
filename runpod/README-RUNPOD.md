# Runpod Single Pod, Two Containers

This guide uses Runpod’s Pod Template UI to run two containers (two separate images) in one pod.

## Build and Push Images

- Service A (FastAPI 8000):
  - `docker build -t YOUR_USER/service-a:latest services/service-a`
  - `docker push YOUR_USER/service-a:latest`
- Service B (Express 3000):
  - `docker build -t YOUR_USER/service-b:latest services/service-b`
  - `docker push YOUR_USER/service-b:latest`

## Create Pod Template

1. Open Runpod Dashboard → Templates → Create Pod Template.
2. Add Container 1:
   - Image: `YOUR_USER/service-a:latest`
   - Expose port: `8000`
   - Env (optional): `PORT=8000`
3. Add Container 2:
   - Image: `YOUR_USER/service-b:latest`
   - Expose port: `3000`
   - Env (optional): `PORT=3000`
4. Optional: Add a shared volume mounted to `/shared` in both containers.
5. GPU (optional): assign GPU to the pod if needed by your apps.
6. Save the template and launch a pod.

## Validate

- External check:
  - `curl https://<pod-endpoint-for-8000>/` → JSON from Service A
  - `curl https://<pod-endpoint-for-3000>/` → JSON from Service B
- Internal check (from console of either container):
  - `curl http://localhost:8000/` and `curl http://localhost:3000/`

## Notes

- Both images listen on `PORT` env var (default 8000/3000). Override if you prefer different ports.
- Containers in a single pod share the network namespace; use `localhost` for inter-service calls.
- If multi-container isn’t available for your account, use the fallback single-image approach in the root `README.md`.

