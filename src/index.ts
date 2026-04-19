#!/usr/bin/env node
import { Command } from "commander"
import { initCommand } from "./commands/init"
import { translateCommand } from "./commands/translate"
import { statusCommand } from "./commands/status"
import { pullCommand } from "./commands/pull"

const pkg = require("../package.json")

const program = new Command()

program
  .name("jason")
  .description("Jason CLI — automate your i18n translations from the command line")
  .version(pkg.version)

program
  .command("init")
  .description("Initialize a .jasonrc config file in the current directory")
  .action(initCommand)

program
  .command("translate")
  .description("Send the source file to Jason for translation")
  .option("-f, --file <path>", "Source file (defaults to sourceFile in .jasonrc)")
  .option("-l, --languages <list>", "Comma-separated target languages, ex: en,de,es")
  .option("-c, --config <path>", "Path to .jasonrc", ".jasonrc")
  .option("-w, --watch", "Wait for the translation to complete before exiting")
  .action(translateCommand)

program
  .command("status <jobId>")
  .description("Check the status of a translation job")
  .option("-w, --watch", "Poll until the job is done")
  .option("-c, --config <path>", "Path to .jasonrc", ".jasonrc")
  .action(statusCommand)

program
  .command("pull")
  .description("Download translations and write JSON files locally")
  .option("-l, --languages <list>", "Comma-separated languages to pull")
  .option("-o, --output <dir>", "Output directory (defaults to outputDir in .jasonrc)")
  .option("-c, --config <path>", "Path to .jasonrc", ".jasonrc")
  .action(pullCommand)

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
