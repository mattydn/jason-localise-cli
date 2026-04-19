/**
 * Aplatit un objet JSON imbriqué en clés pointées.
 * Ex : { a: { b: { c: 1 } } } -> { "a.b.c": 1 }
 */
export function flatten(obj: any, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey))
    } else if (typeof value === "string") {
      result[newKey] = value
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[newKey] = String(value)
    }
    // arrays et autres types ignorés
  }
  return result
}

/**
 * Reconstruit un objet imbriqué à partir de clés pointées.
 * Ex : { "a.b.c": 1 } -> { a: { b: { c: 1 } } }
 */
export function unflatten(obj: Record<string, string>): any {
  const result: any = {}
  for (const [path, value] of Object.entries(obj)) {
    const parts = path.split(".")
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (typeof current[part] !== "object" || current[part] === null) {
        current[part] = {}
      }
      current = current[part]
    }
    current[parts[parts.length - 1]] = value
  }
  return result
}

/**
 * Détecte si un JSON est imbriqué (nested) ou plat (flat).
 * Plat = toutes les valeurs sont des strings/primitives.
 */
export function detectFormat(obj: any): "flat" | "nested" {
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return "nested"
    }
  }
  return "flat"
}
