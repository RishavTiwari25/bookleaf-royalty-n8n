#!/bin/sh
# Render free tier has an ephemeral filesystem, so the workflow is (re)imported
# and activated on every boot. Secrets come from environment variables.
set -e

n8n import:workflow --input=/workflow/bookleaf-royalty-summary.json
n8n update:workflow --all --active=true

exec n8n start
