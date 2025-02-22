import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import devServer from '@hono/vite-dev-server'
import pc from 'picocolors'
import { createLogger, createServer } from 'vite'
import { findEntrypoint } from '../utils/findEntrypoint.js'
import { version } from '../version.js'

type DevOptions = { host?: boolean; port?: number }

export async function dev(
  entry_: string | undefined,
  { host, port }: DevOptions = {},
) {
  const entry = entry_ || (await findEntrypoint())

  const entry_resolved = resolve(join(process.cwd(), entry))
  if (!existsSync(entry_resolved))
    throw new Error(`entrypoint not found: ${entry_resolved}`)

  const server = await createServer({
    root: process.cwd(),
    server: {
      host,
      port,
    },
    plugins: [
      devServer({
        entry: entry_resolved,
        // Note: we are not relying on the default export so we can be compatible with
        // runtimes that rely on it (ie. Vercel Serverless Functions).
        export: 'app',
      }),
    ],
  })

  const module = await server.ssrLoadModule(entry_resolved)
  const basePath = module.app?.basePath || '/'

  await server.listen()

  const logger = createLogger()
  logger.clearScreen('info')
  logger.info('')
  logger.info(
    `  ${pc.green('[running]')} ${pc.bold('frog')}@${pc.dim(`v${version}`)}`,
  )
  logger.info('')
  logger.info(
    `  ${pc.green('➜')}  ${pc.bold('Local')}:   ${pc.cyan(
      `http://localhost:${server.config.server.port}${basePath}`,
    )}`,
  )
}
