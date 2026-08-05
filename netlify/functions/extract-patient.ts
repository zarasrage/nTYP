import type { Handler } from '@netlify/functions'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001'

// Keep uploaded images small: this is a still photo of a document/card,
// not a full-res camera dump. ~6MB of base64 ≈ 4.5MB decoded.
const MAX_BASE64_LENGTH = 6_000_000

const ALLOWED_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const FIELD_KEYS = [
  'full_name',
  'document_id',
  'birth_date',
  'sex',
  'phone',
  'email',
  'address',
  'emergency_contact_name',
  'emergency_contact_phone',
  'blood_type',
  'allergies',
  'medical_notes',
] as const

const EXTRACTION_PROMPT = `Eres un asistente que ayuda a personal de salud a transcribir datos desde una foto de un documento (carnet de identidad, carnet de salud, ficha clínica, etc.) hacia un formulario de registro de pacientes.

Devuelve EXCLUSIVAMENTE un objeto JSON (sin texto adicional, sin markdown) con las claves que puedas identificar con confianza de entre:
${FIELD_KEYS.join(', ')}

Reglas:
- "sex" solo puede ser "M", "F" u "Otro".
- "birth_date" en formato YYYY-MM-DD si es legible.
- Si un dato no aparece claramente en la imagen o no estás seguro, omite esa clave (no inventes valores).
- No incluyas números de documento u otros datos si el texto es ilegible o ambiguo.
- No agregues comentarios ni explicaciones, solo el JSON.`

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

function sanitize(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of FIELD_KEYS) {
    const value = raw[key]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (!trimmed) continue
    if (key === 'sex' && !['M', 'F', 'Otro'].includes(trimmed)) continue
    if (key === 'birth_date' && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) continue
    out[key] = trimmed.slice(0, 500)
  }
  return out
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY no está configurada en el servidor.' }),
    }
  }

  let payload: { image?: string; mediaType?: string }
  try {
    payload = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) }
  }

  const { image, mediaType } = payload
  if (!image || typeof image !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta la imagen.' }) }
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Imagen demasiado grande.' }) }
  }
  const safeMediaType = ALLOWED_MEDIA_TYPES.has(mediaType ?? '')
    ? (mediaType as string)
    : 'image/jpeg'

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: safeMediaType,
                  data: image,
                },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Anthropic API error', response.status, detail)
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'No se pudo procesar la imagen con el servicio de IA.' }),
      }
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>
    }
    const text = data.content.find((b) => b.type === 'text')?.text ?? ''
    const parsed = extractJson(text)

    if (!parsed) {
      return {
        statusCode: 200,
        body: JSON.stringify({}),
      }
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sanitize(parsed)),
    }
  } catch (err) {
    console.error('extract-patient error', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error inesperado al procesar la imagen.' }),
    }
  }
}
