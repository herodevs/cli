# This image is used in the demo GitHub workflows to show a minimal docker image scan

FROM mcr.microsoft.com/playwright:v1.50.0-noble
WORKDIR /app
CMD ["node", "--version"]