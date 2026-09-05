function toBase64Url(value: ArrayBuffer) {
  const bytes = new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer
}

function credentialJson(credential: PublicKeyCredential) {
  const response = credential.response
  const base = {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
  }

  if (response instanceof AuthenticatorAttestationResponse) {
    return {
      ...base,
      response: {
        clientDataJSON: toBase64Url(response.clientDataJSON),
        attestationObject: toBase64Url(response.attestationObject),
        transports: response.getTransports?.(),
      },
    }
  }

  const assertion = response as AuthenticatorAssertionResponse
  return {
    ...base,
    response: {
      clientDataJSON: toBase64Url(assertion.clientDataJSON),
      authenticatorData: toBase64Url(assertion.authenticatorData),
      signature: toBase64Url(assertion.signature),
      userHandle: assertion.userHandle ? toBase64Url(assertion.userHandle) : undefined,
    },
  }
}

function requestOptions(options: Record<string, unknown>): PublicKeyCredentialRequestOptions {
  const allowCredentials = Array.isArray(options.allowCredentials)
    ? options.allowCredentials.map((credential) => {
        const value = credential as Record<string, unknown>
        return { ...value, id: fromBase64Url(String(value.id)) } as PublicKeyCredentialDescriptor
      })
    : undefined

  return {
    ...options,
    challenge: fromBase64Url(String(options.challenge)),
    allowCredentials,
  } as PublicKeyCredentialRequestOptions
}

function creationOptions(options: Record<string, unknown>): PublicKeyCredentialCreationOptions {
  const user = options.user as Record<string, unknown>
  const excludeCredentials = Array.isArray(options.excludeCredentials)
    ? options.excludeCredentials.map((credential) => {
        const value = credential as Record<string, unknown>
        return { ...value, id: fromBase64Url(String(value.id)) } as PublicKeyCredentialDescriptor
      })
    : undefined

  return {
    ...options,
    challenge: fromBase64Url(String(options.challenge)),
    user: { ...user, id: fromBase64Url(String(user.id)) },
    excludeCredentials,
  } as PublicKeyCredentialCreationOptions
}

export async function authenticatePasskey(options: Record<string, unknown>) {
  const credential = await navigator.credentials.get({ publicKey: requestOptions(options) })
  if (!(credential instanceof PublicKeyCredential)) throw new Error('Passkey request was cancelled')
  return credentialJson(credential)
}

export async function createPasskey(options: Record<string, unknown>) {
  const credential = await navigator.credentials.create({ publicKey: creationOptions(options) })
  if (!(credential instanceof PublicKeyCredential))
    throw new Error('Passkey registration was cancelled')
  return credentialJson(credential)
}
