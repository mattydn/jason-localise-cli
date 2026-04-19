import ora from "ora"
import kleur from "kleur"
import { loadConfig } from "../lib/config"
import { getJobStatus } from "../lib/api"

interface StatusOptions {
  watch?: boolean
  config?: string
}

export async function statusCommand(jobId: string, options: StatusOptions): Promise<void> {
  const config = loadConfig(options.config)

  if (options.watch) {
    const spinner = ora("Polling...").start()
    while (true) {
      let status
      try {
        status = await getJobStatus(config, jobId)
      } catch (e: any) {
        spinner.fail(kleur.red(e.message))
        process.exit(1)
      }
      spinner.text = `${status.status} — ${status.doneCount}/${status.keyCount} (${status.progress}%)`
      if (status.status === "DONE") {
        spinner.succeed(kleur.green(`Done! ${status.doneCount} translations.`))
        return
      }
      if (status.status === "ERROR") {
        spinner.fail(kleur.red(`Failed: ${status.error || "unknown error"}`))
        process.exit(1)
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  // Single-shot
  let status
  try {
    status = await getJobStatus(config, jobId)
  } catch (e: any) {
    console.error(kleur.red(`✗ ${e.message}`))
    process.exit(1)
  }

  const colorByStatus: Record<string, (s: string) => string> = {
    DONE: kleur.green,
    PROCESSING: kleur.cyan,
    PENDING: kleur.yellow,
    ERROR: kleur.red,
  }
  const color = colorByStatus[status.status] || ((s: string) => s)

  console.log()
  console.log(`  Job ID    : ${kleur.dim(status.jobId)}`)
  console.log(`  Status    : ${color(status.status)}`)
  console.log(`  Progress  : ${status.doneCount}/${status.keyCount} (${status.progress}%)`)
  console.log(`  Languages : ${status.languages.join(", ")}`)
  if (status.error) console.log(`  Error     : ${kleur.red(status.error)}`)
  console.log()
}
