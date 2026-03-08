FROM oven/bun:1.2.5 AS build
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY tsconfig.json ./
COPY src ./src
COPY prompts ./prompts
RUN bun run build

FROM oven/bun:1.2.5 AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prompts ./prompts

USER bun
EXPOSE 8080

CMD ["bun", "dist/index.js"]
