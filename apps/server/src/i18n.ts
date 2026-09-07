import { parse } from '@std/yaml'
import * as z from 'zod'

export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'en'

const Catalogue = z.record(z.string(), z.string())

function loadCatalogue(language: Language): Record<string, string> {
  const url = new URL(`./i18n/${language}.yaml`, import.meta.url)
  return Catalogue.parse(parse(Deno.readTextFileSync(url)))
}

const catalogues: Record<Language, Record<string, string>> = {
  en: loadCatalogue('en'),
  ru: loadCatalogue('ru'),
}

function isSupported(tag: string): tag is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(tag)
}

/** First `Accept-Language` entry Gatekeeper has copy for, else {@link DEFAULT_LANGUAGE}. */
export function resolveLanguage(acceptLanguage: string | null | undefined): Language {
  for (const entry of acceptLanguage?.split(',') ?? []) {
    const primary = entry.split(';')[0]?.trim().toLowerCase().split('-')[0] ?? ''
    if (isSupported(primary)) return primary
  }
  return DEFAULT_LANGUAGE
}

/** Localized copy for a typed error `code`, or `undefined` when the catalogue has none. */
export function localizeErrorMessage(code: string, language: Language): string | undefined {
  return catalogues[language][code]
}
