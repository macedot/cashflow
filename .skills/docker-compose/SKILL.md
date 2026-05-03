---
name: docker-compose
description: Create Dockerfile, .dockerignore (DENY ALL whitelist), docker-compose.yml, and GitHub Actions release workflow for building and pushing Docker images to GHCR. Trigger: "dockerize", "add Docker", "create Dockerfile", "docker compose", "containerize".
---

# Docker Compose Skill

Create a complete Docker setup for any project following macedot conventions: DENY-ALL .dockerignore, security-hardened Dockerfile, docker-compose.yml with resource limits, and GitHub Actions release workflow for GHCR publishing.

## Files to Create

### 1. `.dockerignore` — DENY ALL whitelist

Always start with `*` to deny everything, then explicitly allow only needed files.

```
# ── Deny everything by default ──
*

# Allow directory traversal
!*/

# ── Only the files needed ──
!src/
!src/**
!package.json
!package-lock.json
# ... project-specific files ...

# ── Re-deny within allowed dirs ──
node_modules/
*.test.js
*.log
.git/
*.md
```

### 2. `Dockerfile` — Multi-stage with security hardening

Rules:

- Use specific base image tags (not `:latest`)
- Multi-stage builds when there's a build step
- Run as non-root user (USER directive)
- Include HEALTHCHECK
- Minimal final image (alpine-slim, distroless, or scratch)
- No secrets in image layers

For static SPAs (no build step):

```dockerfile
# syntax=docker/dockerfile:1
FROM nginx:alpine-slim
COPY index.html src/ /usr/share/nginx/html/
RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget --spider http://localhost:80 || exit 1
```

For Go + embedded frontend:

```dockerfile
# syntax=docker/dockerfile:1
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build Go binary
FROM golang:alpine AS backend-build
WORKDIR /app
COPY backend/go.* ./
RUN go mod download
COPY backend/ .
COPY --from=frontend-build /app/dist ./ui/dist/
RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o server .

# Stage 3: Minimal runtime
FROM gcr.io/distroless/static-debian12
COPY --from=backend-build /app/server /app/server
USER 65534:65534
EXPOSE 8080
HEALTHCHECK CMD ["/app/server", "/health"]
ENTRYPOINT ["/app/server"]
```

### 3. `docker-compose.yml` — Production-ready service

Rules:

- Use GHCR image with env var substitution: `ghcr.io/${GHCR_OWNER:-owner}/${IMAGE_TAG:-latest}`
- Include `build` context for local development
- Add `container_name`
- Set `read_only: true` with tmpfs for writable paths
- `security_opt: no-new-privileges:true`
- Resource limits (memory + CPU)
- `restart: unless-stopped`

### 4. `.github/workflows/release.yml` — GHCR publishing

Rules:

- Trigger on `release: types: [published]`
- Skip prereleases: `if: ${{ !github.event.release.prerelease }}`
- Login to GHCR with `${{ secrets.GITHUB_TOKEN }}`
- Extract version from tag (strip `v` prefix)
- Push with version tag + `latest` tag
- Tags format: `ghcr.io/${{ github.repository }}:${{ steps.version.outputs.version }}`

## Container Security Checklist

- [ ] Non-root user (`USER` directive)
- [ ] Read-only root filesystem (`read_only: true`)
- [ ] No-new-privileges (`security_opt: no-new-privileges:true`)
- [ ] Resource limits (memory + CPU)
- [ ] HEALTHCHECK defined
- [ ] No secrets in image (use env vars or mounts)
- [ ] Minimal base image (alpine-slim, distroless)
- [ ] Specific image tags (not `:latest`)
- [ ] .dockerignore denies everything by default
