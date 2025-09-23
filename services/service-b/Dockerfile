FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

# Create non-root user for isolation
RUN addgroup -g 10002 app \
 && adduser -D -u 10002 -G app appuser

COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

COPY . .

# Ensure ownership for runtime user
RUN chown -R appuser:app /app

ENV PORT=9090
EXPOSE 9090

USER appuser

CMD ["node", "server.js"]
