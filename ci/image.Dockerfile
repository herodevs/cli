FROM ghcr.io/cyclonedx/cdxgen:v11.4.4
ENV NODE_NO_WARNINGS=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_LOGLEVEL=error
WORKDIR /app
ARG VERSION=beta
USER root
RUN npm install -g @herodevs/cli@${VERSION}
COPY --chmod=755 ci/docker-entrypoint.sh /usr/local/bin/hd-entrypoint
USER cyclonedx
ENTRYPOINT ["hd-entrypoint"]