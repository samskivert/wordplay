import { createServer } from "esbuild-server"

const server = createServer(
  {
    bundle: true,
    entryPoints: ["src/index.ts"],
  },
  {
    static: "public",
    open: true,
  }
)

const buildStart = Date.now()
server
  .start()
  .then(() => console.log(`Build completed in ${Date.now() - buildStart}ms`))
  .catch(() => console.error("Build failed"))
console.log(`Dev server running at ${server.url}`)
