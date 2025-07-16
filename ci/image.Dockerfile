FROM ghcr.io/cyclonedx/cdxgen:v11.4.3
WORKDIR /app
COPY . .
RUN npm config set update-notifier false && npm config set loglevel error
ENV NODE_NO_WARNINGS=1
ENTRYPOINT ["npm", "exec", "-y", "@herodevs/cli@beta", "--", "scan:eol"]