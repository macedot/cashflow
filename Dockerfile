# syntax=docker/dockerfile:1

# Minimal static file server for CashflowSim SPA
FROM nginx:alpine-slim

# Copy the SPA files (no build step needed — CDN-only app)
COPY index.html /usr/share/nginx/html/
COPY src/ /usr/share/nginx/html/src/

# Security: run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1
