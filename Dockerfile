FROM denoland/deno:2.9.4

WORKDIR /app

COPY deno.json deno.lock ./
COPY packages/contract/deno.json packages/contract/
COPY packages/db/deno.json packages/db/
COPY packages/sdk/deno.json packages/sdk/
COPY apps/server/deno.json apps/server/

RUN deno install --frozen

COPY . .

RUN deno check apps/server/src/main.ts

ENV DENO_DIR=/deno-dir
EXPOSE 8080
USER deno

CMD ["deno", "run", \
  "--allow-net", \
  "--allow-env", \
  "--allow-read=/app,/deno-dir", \
  "--allow-ffi", \
  "apps/server/src/main.ts"]
