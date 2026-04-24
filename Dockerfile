FROM node:22-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Required env vars are validated by the app. These placeholders let the
# production build complete even when Dokploy build-time envs are not set yet.
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/overhall
ARG BETTER_AUTH_SECRET=build-time-placeholder-secret
ARG BETTER_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG R2_ACCOUNT_ID=build-placeholder-account
ARG R2_BUCKET_NAME=build-placeholder-bucket
ARG R2_ACCESS_KEY_ID=build-placeholder-key
ARG R2_SECRET_ACCESS_KEY=build-placeholder-secret

ENV DATABASE_URL=$DATABASE_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV R2_ACCOUNT_ID=$R2_ACCOUNT_ID
ENV R2_BUCKET_NAME=$R2_BUCKET_NAME
ENV R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
ENV R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
