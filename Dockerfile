# Docker Hub mirror (docker.n8n.io rate-limits anonymous pulls from CI/CD)
FROM docker.io/n8nio/n8n:2.22.6

USER root
COPY workflow /workflow
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R node:node /workflow
USER node

ENTRYPOINT ["tini", "--", "/entrypoint.sh"]
