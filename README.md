# @jason-localise/cli

Official command-line interface for **Jason** — the i18n translation automation platform.
Translate your i18n files from your terminal, scripts, or CI/CD.

> 🌐 [jason-localise.com](https://jason-localise.com)

## Installation

```bash
npm install -g @jason-localise/cli
```

This installs the `jason` command globally.

## Quick start

```bash
# 1. Initialize config in your project
jason init

# 2. Translate your source file
jason translate --watch

# 3. Pull the translated files
jason pull
```

## Configuration

`jason init` creates a `.jasonrc` file in your project:

```json
{
  "apiUrl": "https://jason-eo7q.onrender.com",
  "apiKey": "jsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "projectId": "cm4x9z2ab0001abc123",
  "sourceFile": "./locales/fr.json",
  "sourceLanguage": "fr",
  "targetLanguages": ["en", "de", "es"],
  "outputDir": "./locales"
}
```

> ⚠️ Add `.jasonrc` to your `.gitignore` — it contains your API key.
> In CI/CD, use the `JASON_API_KEY` environment variable instead.

## Commands

### `jason init`
Interactive setup. Creates a `.jasonrc` file in the current directory.

### `jason translate`
Reads the source file, sends it to the Jason API, and returns a job ID.

```bash
jason translate                                    # use config defaults
jason translate --file ./src/i18n/fr.json
jason translate --languages en,de,es
jason translate --watch                            # wait for completion
```

### `jason status <jobId>`
Show the current state of a translation job.

```bash
jason status cm5abc123xyz
jason status cm5abc123xyz --watch                  # poll until done
```

### `jason pull`
Download translations and write them to local JSON files.
Auto-detects whether your source file is **flat** or **nested** and writes in the same format.

```bash
jason pull
jason pull --languages en,de
jason pull --output ./src/i18n
```

## CI/CD example — GitHub Actions

```yaml
name: Translate i18n
on:
  push:
    branches: [main]
    paths: ['locales/fr.json']

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @jason-localise/cli
      - run: |
          jason translate --watch
          jason pull
        env:
          JASON_API_KEY: ${{ secrets.JASON_API_KEY }}
      - run: |
          git config user.name 'Jason Bot'
          git config user.email 'bot@jason-localise.com'
          git add locales/
          git commit -m 'chore: update translations' || exit 0
          git push
```

## Environment variables

| Variable | Description |
|---|---|
| `JASON_API_KEY` | Overrides `apiKey` in `.jasonrc`. Use this in CI/CD. |

## Requirements

- Node.js 18 or higher
- A Jason account ([sign up here](https://jason-localise.com))
- An API key (Settings → API Keys)

## License

MIT
