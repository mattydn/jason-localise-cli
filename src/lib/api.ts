import { JasonConfig } from "./config"

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function request<T>(
  config: JasonConfig,
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: any
): Promise<T> {
  const url = `${config.apiUrl}/api/v1${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
  }
  if (body) headers["Content-Type"] = "application/json"

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let json: ApiResponse<T>
  try {
    json = await res.json() as ApiResponse<T>
  } catch {
    throw new Error(`Invalid response from API (HTTP ${res.status})`)
  }

  if (!json.success) {
    throw new Error(json.error || `Request failed (HTTP ${res.status})`)
  }
  return json.data as T
}

export interface TranslateResponse {
  jobId: string
  status: string
  keyCount: number
  languages: string[]
  statusUrl: string
}

export interface JobStatus {
  jobId: string
  status: "PENDING" | "PROCESSING" | "DONE" | "ERROR"
  progress: number
  keyCount: number
  doneCount: number
  languages: string[]
  error: string | null
  createdAt: string
  downloadUrl: string | null
}

export interface DownloadResponse {
  projectId: string
  languages: string[]
  keyCount: number
  exportedAt: string
  translations: Record<string, Record<string, string>>
}

export async function startTranslation(
  config: JasonConfig,
  keys: Record<string, string>,
  targetLanguages: string[]
): Promise<TranslateResponse> {
  return request<TranslateResponse>(config, "POST", "/translate", {
    projectId: config.projectId,
    keys,
    targetLanguages,
    sourceLanguage: config.sourceLanguage,
  })
}

export async function getJobStatus(config: JasonConfig, jobId: string): Promise<JobStatus> {
  return request<JobStatus>(config, "GET", `/status/${jobId}`)
}

export async function downloadTranslations(
  config: JasonConfig,
  languages?: string[],
  onlyApproved: boolean = false
): Promise<DownloadResponse> {
  const params = new URLSearchParams({ projectId: config.projectId })
  if (languages?.length) params.set("languages", languages.join(","))
  if (onlyApproved) params.set("onlyApproved", "true")
  return request<DownloadResponse>(config, "GET", `/download?${params.toString()}`)
}
