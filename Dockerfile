# Docker Hub mirror (docker.n8n.io rate-limits anonymous pulls from CI/CD).
# Pinned to 1.x: v2's mandatory task-runner sidecar OOMs on Render's 512MB free tier.
FROM docker.io/n8nio/n8n:1.94.1

USER root
COPY workflow /workflow
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R node:node /workflow
USER node

ENTRYPOINT ["tini", "--", "/entrypoint.sh"]
