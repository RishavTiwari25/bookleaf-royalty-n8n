FROM docker.n8n.io/n8nio/n8n:latest

USER root
COPY workflow /workflow
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R node:node /workflow
USER node

ENTRYPOINT ["tini", "--", "/entrypoint.sh"]
