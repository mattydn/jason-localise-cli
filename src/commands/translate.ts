import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import ora from "ora"
import kleur from "kleur"
import { loadConfig } from "../lib/config"
import { startTranslation, getJobStatus } from "../lib/api"
import { flatten } from "../lib/flatten"

interface TranslateOptions {
  file?: string
  languages?: string
  config?: string
  watch?: boolean
}

export async function translateCommand(options: TranslateOptions): Promise<void> {
  const config = loadConfig(options.config)

  const sourceFilePath = resolve(process.cwd(), options.file || config.sourceFile)
  if (!existsSync(sourceFilePath)) {
    console.error(kleur.red(`✗ Source file not found: ${sourceFilePath}`))
    process.exit(1)
  }

  const targetLanguages = options.languages
    ? options.languages.split(",").map((s) => s.trim()).filter(Boolean)
    : config.targetLanguages

  if (!targetLanguages.length) {
    console.error(kleur.red("✗ No target languages specified."))
    process.exit(1)
  }

  let raw: any
  try {
    raw = JSON.parse(readFileSync(sourceFilePath, "utf-8"))
  } catch (e: any) {
    console.error(kleur.red(`✗ Invalid JSON in ${sourceFilePath}: ${e.message}`))
    process.exit(1)
  }

  const flatKeys = flatten(raw)
  const keyCount = Object.keys(flatKeys).length

  if (keyCount === 0) {
    console.error(kleur.red("✗ Source file is empty."))
    process.exit(1)
  }

  console.log(
    kleur.dim(
      `Translating ${kleur.bold(String(keyCount))} keys from ${kleur.bold(
        config.sourceLanguage
      )} to ${kleur.bold(targetLanguages.join(", "))}...`
    )
  )

  const spinner = ora("Sending to Jason...").start()
  let job
  try {
    job = await startTranslation(config, flatKeys, targetLanguages)
    spinner.succeed(`Job started: ${kleur.cyan(job.jobId)}`)
  } catch (e: any) {
    spinner.fail(kleur.red(`Failed: ${e.message}`))
    process.exit(1)
  }

  if (!options.watch) {
    console.log(
      kleur.dim(
        `\nRun ${kleur.cyan(`jason status ${job.jobId} --watch`)} to track progress.`
      )
    )
    return
  }

  // Mode watch : poll jusqu'à completion
  const watchSpinner = ora("Translating...").start()
  while (true) {
    await new Promise((r) => setTimeout(r, 2000))
    let status
    try {
      status = await getJobStatus(config, job.jobId)
    } catch (e: any) {
      watchSpinner.fail(kleur.red(`Status check failed: ${e.message}`))
      process.exit(1)
    }
    watchSpinner.text = `Translating... ${status.doneCount}/${status.keyCount} (${status.progress}%)`
    if (status.status === "DONE") {
      watchSpinner.succeed(kleur.green(`Done! ${status.doneCount} translations.`))
      console.log(kleur.dim(`Run ${kleur.cyan("jason pull")} to download the translations.`))
      return
    }
    if (status.status === "ERROR") {
      watchSpinner.fail(kleur.red(`Translation failed: ${status.error || "unknown error"}`))
      process.exit(1)
    }
  }
}
