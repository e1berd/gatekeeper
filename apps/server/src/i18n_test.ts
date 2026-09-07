import { assertEquals } from '@std/assert'
import { parse } from '@std/yaml'
import { localizeErrorMessage, resolveLanguage } from './i18n.ts'

Deno.test('resolveLanguage picks the first supported primary subtag', () => {
  assertEquals(resolveLanguage('ru,en;q=0.9'), 'ru')
  assertEquals(resolveLanguage('ru-RU,ru;q=0.9,en;q=0.8'), 'ru')
  assertEquals(resolveLanguage('en-US'), 'en')
})

Deno.test('resolveLanguage falls back to English', () => {
  assertEquals(resolveLanguage('fr-FR,de;q=0.5'), 'en')
  assertEquals(resolveLanguage(''), 'en')
  assertEquals(resolveLanguage(null), 'en')
  assertEquals(resolveLanguage(undefined), 'en')
})

Deno.test('localizeErrorMessage returns per-language copy, or undefined for an unknown code', () => {
  assertEquals(localizeErrorMessage('EMAIL_TAKEN', 'ru'), 'Эта почта уже зарегистрирована')
  assertEquals(localizeErrorMessage('EMAIL_TAKEN', 'en'), 'Email already registered')
  assertEquals(localizeErrorMessage('NOT_A_REAL_CODE', 'ru'), undefined)
})

Deno.test('the en and ru catalogues cover the same codes', () => {
  const codes = (language: string) => {
    const url = new URL(`./i18n/${language}.yaml`, import.meta.url)
    return Object.keys(parse(Deno.readTextFileSync(url)) as Record<string, unknown>).toSorted()
  }

  assertEquals(codes('ru'), codes('en'))
})
