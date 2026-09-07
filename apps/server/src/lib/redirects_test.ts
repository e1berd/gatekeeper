import { assertEquals } from '@std/assert'
import { toAllowedRedirect } from './redirects.ts'

const ALLOWED = ['http://localhost:3000', 'https://app.example.com']
const FALLBACK = 'https://id.example.com'

Deno.test('a target on an allowed origin is kept whole', () => {
  assertEquals(
    toAllowedRedirect('http://localhost:3000/welcome?next=1', ALLOWED, FALLBACK),
    'http://localhost:3000/welcome?next=1',
  )
})

Deno.test('a target on an unlisted origin falls back', () => {
  assertEquals(toAllowedRedirect('https://evil.example.com/steal', ALLOWED, FALLBACK), FALLBACK)
})

Deno.test('a lookalike host does not pass for the real one', () => {
  assertEquals(toAllowedRedirect('https://app.example.com.evil.test', ALLOWED, FALLBACK), FALLBACK)
})

Deno.test('the scheme is part of the origin', () => {
  assertEquals(toAllowedRedirect('https://localhost:3000/welcome', ALLOWED, FALLBACK), FALLBACK)
})

Deno.test('the port is part of the origin', () => {
  assertEquals(toAllowedRedirect('http://localhost:3001/welcome', ALLOWED, FALLBACK), FALLBACK)
})

Deno.test('a relative target resolves against the fallback and is allowed only if it lands there', () => {
  assertEquals(toAllowedRedirect('/back', [FALLBACK], FALLBACK), 'https://id.example.com/back')
  assertEquals(toAllowedRedirect('/back', ALLOWED, FALLBACK), FALLBACK)
})

Deno.test('a missing or unparseable target falls back', () => {
  assertEquals(toAllowedRedirect(null, ALLOWED, FALLBACK), FALLBACK)
  assertEquals(toAllowedRedirect(undefined, ALLOWED, FALLBACK), FALLBACK)
  assertEquals(toAllowedRedirect('', ALLOWED, FALLBACK), FALLBACK)
  assertEquals(toAllowedRedirect('http://', ALLOWED, FALLBACK), FALLBACK)
})
