import { assertInstanceOf } from '@std/assert'
import { Gatekeeper } from './mod.ts'

Deno.test('Gatekeeper accepts a URL instance', () => {
  const gatekeeper = new Gatekeeper(new URL('https://id.example.com'))

  assertInstanceOf(gatekeeper, Gatekeeper)
})
