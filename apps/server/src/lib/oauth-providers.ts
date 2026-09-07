import * as z from 'zod'

const PROFILE_TIMEOUT_MS = 8_000

export interface OAuthProfile {
  providerUserId: string
  email: string | null
  emailVerified: boolean
  name: string | null
  avatarUrl: string | null
}

export interface OAuthProvider {
  slug: string
  authorizationEndpoint: string
  tokenEndpoint: string
  defaultScopes: string[]
  fetchProfile(accessToken: string): Promise<OAuthProfile>
}

const GoogleUserInfo = z.object({
  sub: z.string(),
  email: z.email().nullish(),
  email_verified: z.boolean().nullish(),
  name: z.string().nullish(),
  picture: z.url().nullish(),
})

const GitHubUser = z.object({
  id: z.number().int(),
  login: z.string(),
  name: z.string().nullish(),
  avatar_url: z.url().nullish(),
})

const GitHubEmails = z.array(
  z.object({ email: z.email(), primary: z.boolean(), verified: z.boolean() }),
)

async function readJson(url: string, accessToken: string, accept: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept,
      'user-agent': 'gatekeeper',
    },
    signal: AbortSignal.timeout(PROFILE_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`${url} answered ${response.status}`)

  return await response.json()
}

const google: OAuthProvider = {
  slug: 'google',
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  defaultScopes: ['openid', 'email', 'profile'],

  async fetchProfile(accessToken) {
    const info = GoogleUserInfo.parse(
      await readJson(
        'https://openidconnect.googleapis.com/v1/userinfo',
        accessToken,
        'application/json',
      ),
    )

    return {
      providerUserId: info.sub,
      email: info.email ?? null,
      emailVerified: info.email_verified === true,
      name: info.name ?? null,
      avatarUrl: info.picture ?? null,
    }
  },
}

const github: OAuthProvider = {
  slug: 'github',
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  defaultScopes: ['read:user', 'user:email'],

  async fetchProfile(accessToken) {
    const accept = 'application/vnd.github+json'
    const user = GitHubUser.parse(
      await readJson('https://api.github.com/user', accessToken, accept),
    )
    const emails = GitHubEmails.parse(
      await readJson('https://api.github.com/user/emails', accessToken, accept),
    )

    const primary =
      emails.find((entry) => entry.primary && entry.verified) ??
      emails.find((entry) => entry.verified)

    return {
      providerUserId: String(user.id),
      email: primary?.email ?? null,
      emailVerified: primary !== undefined,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url ?? null,
    }
  },
}

const PROVIDERS: readonly OAuthProvider[] = [google, github]

/**
 * The providers Gatekeeper knows how to talk to. A deployment still has to
 * supply credentials under `oauth.<slug>` before one can be used, so knowing a
 * provider and offering it are separate things.
 */
export function findProvider(slug: string): OAuthProvider | undefined {
  return PROVIDERS.find((provider) => provider.slug === slug)
}
