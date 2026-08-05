/**
 * Structured JSON logger for a client-only SPA (no Node backend, so Winston/Pino
 * don't apply — Winston needs Node's fs/streams, Pino's core doesn't run in a
 * browser). Every record is a flat JSON object: level, message, timestamp, plus
 * whatever context the caller attaches (action, userId, requestId, ...).
 *
 * All context/error payloads pass through `redact()` before being emitted, so a
 * sensitive key (password, token, apikey, ...) can never reach the console or a
 * remote sink, no matter what a call site accidentally logs.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  action: string
  userId?: string
  requestId?: string | number
  [key: string]: unknown
}

export interface LogRecord {
  timestamp: string
  level: LogLevel
  message: string
  [key: string]: unknown
}

const SENSITIVE_KEYS = new Set([
  'password',
  'senha',
  'pwd',
  'token',
  'access_token',
  'refresh_token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'api_key',
  'authorization',
  'auth',
  'secret',
  'jwt',
  'client_secret',
])

const REDACTED = '[REDACTED]'

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[Truncated]'
  if (value == null) return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack }
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(val, depth + 1)
    }
    return out
  }
  return value
}

/** Optional remote sink (e.g. Sentry) — wired up separately, never required for logging to work. */
let sink: ((record: LogRecord) => void) | null = null

export function setLogSink(fn: typeof sink) {
  sink = fn
}

function emit(level: LogLevel, message: string, context: LogContext, error?: unknown) {
  const record: LogRecord = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(redact(context) as Record<string, unknown>),
    ...(error !== undefined ? { error: redact(error) } : {}),
  }

  const json = JSON.stringify(record)
  if (level === 'info') console.info(json)
  else if (level === 'warn') console.warn(json)
  else console.error(json)

  sink?.(record)
}

export const logger = {
  info: (message: string, context: LogContext) => emit('info', message, context),
  warn: (message: string, context: LogContext, error?: unknown) => emit('warn', message, context, error),
  error: (message: string, context: LogContext, error?: unknown) => emit('error', message, context, error),
  fatal: (message: string, context: LogContext, error?: unknown) => emit('fatal', message, context, error),
}
