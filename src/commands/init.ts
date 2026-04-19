import { existsSync } from "fs"
import { resolve } from "path"
import prompts from "prompts"
import kleur from "kleur"
import { saveConfig, JasonConfig } from "../lib/config"

export async function initCommand(): Promise<void> {
  const configPath = resolve(process.cwd(), ".jasonrc")

  if (existsSync(configPath)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: ".jasonrc already exists. Overwrite?",
      initial: false,
    })
    if (!overwrite) {
      console.log(kleur.yellow("Aborted."))
      return
    }
  }

  console.log(kleur.bold("\n{J}ason. — initialisation\n"))

  const responses = await prompts([
    {
      type: "text",
      name: "apiUrl",
      message: "API URL",
      initial: "https://jason-eo7q.onrender.com",
    },
    {
      type: "password",
      name: "apiKey",
      message: "API key (jsk_live_...)",
      validate: (v: string) =>
        v.startsWith("jsk_live_") ? true : "API key must start with jsk_live_",
    },
    {
      type: "text",
      name: "projectId",
      message: "Project ID",
      validate: (v: string) => (v.length > 0 ? true : "Project ID is required"),
    },
    {
      type: "text",
      name: "sourceFile",
      message: "Source file path",
      initial: "./locales/fr.json",
    },
    {
      type: "text",
      name: "sourceLanguage",
      message: "Source language code",
      initial: "fr",
    },
    {
      type: "text",
      name: "targetLanguagesRaw",
      message: "Target languages (comma-separated)",
      initial: "en,de,es",
    },
    {
      type: "text",
      name: "outputDir",
      message: "Output directory",
      initial: "./locales",
    },
  ])

  if (!responses.apiKey || !responses.projectId) {
    console.log(kleur.yellow("\nCancelled."))
    return
  }

  const config: JasonConfig = {
    apiUrl: responses.apiUrl,
    apiKey: responses.apiKey,
    projectId: responses.projectId,
    sourceFile: responses.sourceFile,
    sourceLanguage: responses.sourceLanguage,
    targetLanguages: responses.targetLanguagesRaw
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean),
    outputDir: responses.outputDir,
  }

  saveConfig(config)
  console.log(kleur.green(`\n✓ Created .jasonrc at ${configPath}`))
  console.log(
    kleur.dim(
      "  Add .jasonrc to your .gitignore (it contains your API key)\n" +
        "  In CI/CD, set JASON_API_KEY env variable instead."
    )
  )
}
