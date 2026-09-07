import type { Config } from '../config.ts'

export interface OutgoingMail {
  to: string
  subject: string
  body: string
}

export interface Mailer {
  send(mail: OutgoingMail): Promise<void>
}

type MailConfig = Config['mail']

function linkTo(base: string, token: string): string {
  const url = new URL(base)
  url.searchParams.set('token', token)

  return url.toString()
}

export function verificationMail(to: string, base: string, token: string): OutgoingMail {
  return {
    to,
    subject: 'Confirm your email address',
    body: `Confirm your email address: ${linkTo(base, token)}`,
  }
}

export function passwordResetMail(to: string, base: string, token: string): OutgoingMail {
  return {
    to,
    subject: 'Reset your password',
    body: `Reset your password: ${linkTo(base, token)}`,
  }
}

export function signInCodeMail(to: string, code: string): OutgoingMail {
  return {
    to,
    subject: 'Your sign-in code',
    body: `Your sign-in code is ${code}.`,
  }
}

/**
 * Delivery for the out-of-band flows.
 *
 * TODO: SMTP delivery is M8 and needs a dependency decision first; until then
 * every message is written to the log, and a configured `mail.smtpUrl` warns
 * once that nothing is actually being sent.
 */
export function createMailer(config: MailConfig): Mailer {
  let warned = false

  return {
    send(mail) {
      if (config.smtpUrl && !warned) {
        warned = true
        console.warn('[gatekeeper] mail.smtpUrl is set but SMTP delivery is not implemented yet')
      }

      console.info(`[gatekeeper] mail to=${mail.to} subject=${mail.subject}\n${mail.body}`)

      return Promise.resolve()
    },
  }
}
