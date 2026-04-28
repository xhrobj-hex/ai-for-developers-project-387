#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BACKEND_PORT:=8081}"

envsubst '${PORT} ${BACKEND_PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

PORT="${BACKEND_PORT}" /app/api &

exec nginx -g 'daemon off;'
