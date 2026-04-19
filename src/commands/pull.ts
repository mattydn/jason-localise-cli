import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs"
import { resolve, dirname } from "path"
import ora from "ora"
import kleur from "kleur"
import { loadConfig } from "../lib/config"
import { downloadTranslations } from "../lib/api"
import { unflatten, detectFormat } from "../lib/flatten"

interface PullOptions {
  languages?: string
  output?: string
  config?: string
  validated?: boolean
}

export async function pullCommand(options: PullOptions): Promise<void> {
  const config = loadConfig(options.config)

  const targetLanguages = options.languages
    ? options.languages.split(",").map((s) => s.trim()).filter(Boolean)
    : config.targetLanguages

  const outputDir = resolve(process.cwd(), options.output || config.outputDir)

  // Détecter le format du fichier source pour écrire dans le même format
  let format: "flat" | "nested" = "nested"
  const sourcePath = resolve(process.cwd(), config.sourceFile)
  if (existsSync(sourcePath)) {
    try {
      const sourceRaw = JSON.parse(readFileSync(sourcePath, "utf-8"))
      format = detectFormat(sourceRaw)
    } catch {
      // ignore
    }
  }

  const onlyApproved = options.validated === true
  const spinner = ora(
    onlyApproved
      ? `Downloading approved translations only...`
      : `Downloading translations...`
  ).start()
  let download
  try {
    download = await downloadTranslations(
      config,
      targetLanguages.length ? targetLanguages : undefined,
      onlyApproved
    )
  } catch (e: any) {
    spinner.fail(kleur.red(e.message))
    process.exit(1)
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const written: string[] = []
  for (const [lang, flatTranslations] of Object.entries(download.translations)) {
    if (Object.keys(flatTranslations).length === 0) continue
    const data = format === "nested" ? unflatten(flatTranslations) : flatTranslations
    const outPath = resolve(outputDir, `${lang}.json`)
    if (!existsSync(dirname(outPath))) {
      mkdirSync(dirname(outPath), { recursive: true })
    }
    writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n", "utf-8")
    written.push(outPath)
  }

  spinner.succeed(
    kleur.green(`Downloaded ${written.length} language(s)`) +
      kleur.dim(` (${format} format)`)
  )
  for (const path of written) {
    console.log(kleur.dim(`  → ${path}`))
  }
}
