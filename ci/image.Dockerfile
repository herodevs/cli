FROM ghcr.io/cyclonedx/cdxgen:v12.0.0
ENV NODE_NO_WARNINGS=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_LOGLEVEL=error
WORKDIR /app
ARG VERSION=2.0.1
USER root
RUN npm install -g @herodevs/cli@${VERSION}
COPY --chmod=755 ci/docker-entrypoint.sh /usr/local/bin/hd-entrypoint
USER cyclonedx
ENTRYPOINT ["hd-entrypoint"]