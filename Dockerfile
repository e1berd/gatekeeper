FROM denoland/deno:2.9.4

WORKDIR /app

COPY deno.json deno.lock ./
COPY packages/contract/deno.json packages/contract/
COPY packages/db/deno.json packages/db/
COPY packages/sdk/deno.json packages/sdk/
COPY packages/sdk/package.json packages/sdk/
COPY apps/server/deno.json apps/server/
COPY apps/docs/deno.json apps/docs/
COPY apps/example/deno.json apps/example/

RUN deno install --frozen

COPY . .

RUN deno check apps/server/src/main.ts

ENV DENO_DIR=/deno-dir
EXPOSE 8080
RUN chown deno:deno /app/node_modules/@gatekeeper
USER deno

CMD ["deno", "run", \
  "--allow-net", \
  "--allow-read=/app,/deno-dir", \
  "--allow-env", \
  "--allow-sys", \
  "--allow-ffi", \
  "apps/server/src/main.ts"]
