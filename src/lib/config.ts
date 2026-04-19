import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

export interface JasonConfig {
  apiUrl: string
  apiKey: string
  projectId: string
  sourceFile: string
  sourceLanguage: string
  targetLanguages: string[]
  outputDir: string
}

const DEFAULT_API_URL = "https://jason-eo7q.onrender.com"

export function loadConfig(configPath: string = ".jasonrc"): JasonConfig {
  const fullPath = resolve(process.cwd(), configPath)
  if (!existsSync(fullPath)) {
    throw new Error(
      `Configuration file not found: ${fullPath}\nRun "jason init" to create one.`
    )
  }
  let raw: any
  try {
    raw = JSON.parse(readFileSync(fullPath, "utf-8"))
  } catch (e: any) {
    throw new Error(`Invalid JSON in ${configPath}: ${e.message}`)
  }
  // Surcharger apiKey par la variable d'env si présente (utile en CI/CD)
  const apiKey = process.env.JASON_API_KEY || raw.apiKey
  if (!apiKey) {
    throw new Error(
      `No API key found. Set "apiKey" in ${configPath} or the JASON_API_KEY environment variable.`
    )
  }
  if (!raw.projectId) throw new Error(`Missing "projectId" in ${configPath}`)
  if (!raw.sourceFile) throw new Error(`Missing "sourceFile" in ${configPath}`)
  return {
    apiUrl: raw.apiUrl || DEFAULT_API_URL,
    apiKey,
    projectId: raw.projectId,
    sourceFile: raw.sourceFile,
    sourceLanguage: raw.sourceLanguage || "fr",
    targetLanguages: raw.targetLanguages || [],
    outputDir: raw.outputDir || "./locales",
  }
}

export function saveConfig(config: JasonConfig, configPath: string = ".jasonrc"): void {
  const fullPath = resolve(process.cwd(), configPath)
  writeFileSync(fullPath, JSON.stringify(config, null, 2) + "\n", "utf-8")
}
