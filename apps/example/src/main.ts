import { createApp, computed, onMounted, ref, shallowRef } from 'vue'
import { Gatekeeper } from '@gatekeeper/sdk'
import { authenticatePasskey, createPasskey } from './webauthn.ts'
// oxlint-disable-next-line import/no-unassigned-import
import './style.css'

const defaultUrl =
  (import.meta as ImportMeta & { env?: { VITE_GATEKEEPER_URL?: string } }).env
    ?.VITE_GATEKEEPER_URL ?? 'http://localhost:8000'
const storedUrl = localStorage.getItem('gatekeeper-example:url') ?? defaultUrl
const storedRealm = localStorage.getItem('gatekeeper-example:realm') ?? 'master'

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Не удалось выполнить запрос. Проверьте адрес Gatekeeper и CORS-настройки.'
}

createApp({
  setup() {
    const url = ref(storedUrl)
    const realm = ref(storedRealm)
    const screen = ref<'auth' | 'account' | 'security'>('auth')
    const mode = ref<'sign-in' | 'sign-up' | 'otp' | 'reset'>('sign-in')
    const notice = ref('')
    const pending = ref(false)
    const session = ref<Awaited<ReturnType<Gatekeeper['auth']['getSession']>> | null>(null)
    const mfa = ref<{ challengeToken: string; factorId: string } | null>(null)
    const otpSent = ref(false)
    const resetToken = ref(new URLSearchParams(location.search).get('token') ?? '')
    const qrCode = ref('')
    const enrollment = ref<{ factorId: string } | null>(null)
    const recoveryCodes = ref<string[]>([])
    const factors = ref<Awaited<ReturnType<Gatekeeper['auth']['mfa']['listFactors']>>['items']>([])
    const passkeys = ref<Awaited<ReturnType<Gatekeeper['auth']['passkeys']['list']>>['items']>([])

    function newClient() {
      const next = new Gatekeeper(url.value, { realm: realm.value || undefined })
      next.addEventListener('signout', () => {
        session.value = null
        screen.value = 'auth'
      })
      return next
    }

    const client = shallowRef(newClient())

    function createClient() {
      client.value = newClient()
    }

    const signedIn = computed(() => session.value !== null)

    function saveSettings() {
      localStorage.setItem('gatekeeper-example:url', url.value)
      localStorage.setItem('gatekeeper-example:realm', realm.value)
      createClient()
      notice.value = 'Настройки подключения сохранены.'
    }

    async function run(action: () => Promise<void>) {
      pending.value = true
      notice.value = ''
      try {
        await action()
      } catch (error) {
        notice.value = errorMessage(error)
      } finally {
        pending.value = false
      }
    }

    async function loadAccount() {
      const [current, me] = await Promise.all([
        client.value.auth.getSession(),
        client.value.auth.getMe(),
      ])
      session.value = { ...current, user: me.user }
      screen.value = 'account'
      await loadSecurity()
    }

    async function loadSecurity() {
      const [nextFactors, nextPasskeys] = await Promise.all([
        client.value.auth.mfa.listFactors(),
        client.value.auth.passkeys.list(),
      ])
      factors.value = nextFactors.items
      passkeys.value = nextPasskeys.items
    }

    async function receive(result: Awaited<ReturnType<Gatekeeper['auth']['signIn']>>) {
      if (result.status === 'authenticated') return await loadAccount()
      if (result.status === 'mfa_required') {
        mfa.value = { challengeToken: result.challengeToken, factorId: result.factors[0]?.id ?? '' }
        notice.value = 'Введите код второго фактора.'
        return
      }
      notice.value = `Требуется подтверждение: ${result.reason}.`
    }

    async function signIn(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(
        async () =>
          await receive(
            await client.value.auth.signIn({
              email: String(data.get('email')),
              password: String(data.get('password')),
            }),
          ),
      )
    }

    async function signUp(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(
        async () =>
          await receive(
            await client.value.auth.signUp({
              email: String(data.get('email')),
              password: String(data.get('password')),
            }),
          ),
      )
    }

    async function sendOtp(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(async () => {
        const result = await client.value.auth.requestOtp({
          channel: 'email',
          identifier: String(data.get('email')),
        })
        otpSent.value = result.sent
        notice.value = `Код отправлен. Он действует ${result.expiresIn} секунд.`
      })
    }

    async function verifyOtp(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(
        async () =>
          await receive(
            await client.value.auth.verifyOtp({
              channel: 'email',
              identifier: String(data.get('email')),
              code: String(data.get('code')),
            }),
          ),
      )
    }

    async function requestReset(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(async () => {
        await client.value.auth.requestPasswordReset({ email: String(data.get('email')) })
        notice.value = 'Если учётная запись существует, на почту отправлена ссылка для сброса.'
      })
    }

    async function resetPassword(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(async () => {
        await client.value.auth.resetPassword({
          token: resetToken.value,
          password: String(data.get('password')),
        })
        mode.value = 'sign-in'
        notice.value = 'Пароль обновлён. Теперь войдите с новым паролем.'
      })
    }

    async function verifyMfa(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      const challenge = mfa.value
      if (!challenge?.factorId) return
      await run(async () => {
        const result = await client.value.auth.mfa.verifyChallenge({
          challengeToken: challenge.challengeToken,
          factorId: challenge.factorId,
          code: String(data.get('code')),
        })
        mfa.value = null
        await receive(result)
      })
    }

    async function signInWithPasskey() {
      await run(async () => {
        const challenge = await client.value.auth.passkeys.authenticateOptions({})
        const response = await authenticatePasskey(challenge.options)
        await receive(
          await client.value.auth.verifyPasskey({ challengeId: challenge.challengeId, response }),
        )
      })
    }

    async function startOAuth(provider: string) {
      await run(async () => {
        const callback = `${location.origin}${location.pathname}`
        const result = await client.value.auth.oauth.start({ provider, redirectTo: callback })
        location.assign(result.authorizationUrl)
      })
    }

    async function startSso(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      await run(async () => {
        const { provider } = await client.value.sso.discover({ email: String(data.get('email')) })
        if (!provider) {
          notice.value = 'Для этого адреса SSO-провайдер не настроен.'
          return
        }
        const callback = `${location.origin}${location.pathname}`
        const result = await client.value.sso.start({
          providerId: provider.id,
          redirectTo: callback,
        })
        location.assign(result.redirectUrl)
      })
    }

    async function registerPasskey() {
      await run(async () => {
        const challenge = await client.value.auth.passkeys.registerOptions({ name: 'Этот браузер' })
        const response = await createPasskey(challenge.options)
        await client.value.auth.passkeys.registerVerify({
          challengeId: challenge.challengeId,
          response,
          name: 'Этот браузер',
        })
        await loadSecurity()
        notice.value = 'Passkey добавлен.'
      })
    }

    async function enrollTotp() {
      await run(async () => {
        const result = await client.value.auth.mfa.enrollTotp({ name: 'Authenticator' })
        enrollment.value = { factorId: result.factorId }
        qrCode.value = result.qrCodeSvg
        screen.value = 'security'
        notice.value = 'Отсканируйте QR-код и подтвердите кодом из приложения.'
      })
    }

    async function confirmTotp(event: SubmitEvent) {
      const data = new FormData(event.target as HTMLFormElement)
      const totpEnrollment = enrollment.value
      if (!totpEnrollment) return
      await run(async () => {
        const result = await client.value.auth.mfa.verifyTotpEnrolment({
          factorId: totpEnrollment.factorId,
          code: String(data.get('code')),
        })
        recoveryCodes.value = result.recoveryCodes
        enrollment.value = null
        qrCode.value = ''
        await loadSecurity()
      })
    }

    async function signOut() {
      await run(async () => {
        await client.value.auth.signOut()
      })
    }

    onMounted(() => {
      const params = new URLSearchParams(location.search)
      const code = params.get('code')
      if (code) {
        run(async () => await receive(await client.value.auth.oauth.exchange({ code })))
        return
      }
      run(async () => {
        if (await client.value.auth.isAuthenticated()) await loadAccount()
      })
    })

    return {
      url,
      realm,
      screen,
      mode,
      notice,
      pending,
      session,
      mfa,
      otpSent,
      resetToken,
      qrCode,
      enrollment,
      recoveryCodes,
      factors,
      passkeys,
      signedIn,
      saveSettings,
      signIn,
      signUp,
      sendOtp,
      verifyOtp,
      requestReset,
      resetPassword,
      verifyMfa,
      signInWithPasskey,
      startOAuth,
      startSso,
      registerPasskey,
      enrollTotp,
      confirmTotp,
      signOut,
      loadAccount,
      loadSecurity,
    }
  },
  template: `
    <main class="shell">
      <header><a class="brand" href="#">Gatekeeper <span>Vue</span></a><nav v-if="signedIn"><button @click="screen = 'account'">Аккаунт</button><button @click="screen = 'security'; loadSecurity()">Безопасность</button><button @click="signOut">Выйти</button></nav></header>
      <section class="connection"><label>Gatekeeper URL <input v-model="url" @change="saveSettings" /></label><label>Realm <input v-model="realm" @change="saveSettings" /></label></section>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <section v-if="mfa" class="card compact"><h1>Подтвердите вход</h1><form @submit.prevent="verifyMfa"><input name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="Код MFA" required /><button :disabled="pending">Подтвердить</button></form></section>
      <section v-else-if="!signedIn" class="card auth">
        <div class="tabs"><button :class="{ active: mode === 'sign-in' }" @click="mode = 'sign-in'">Вход</button><button :class="{ active: mode === 'sign-up' }" @click="mode = 'sign-up'">Регистрация</button><button :class="{ active: mode === 'otp' }" @click="mode = 'otp'">Код</button></div>
        <form v-if="mode === 'sign-in'" @submit.prevent="signIn"><h1>С возвращением</h1><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required /><input name="password" type="password" autocomplete="current-password" placeholder="Пароль" required /><button :disabled="pending">Войти</button><button class="text" type="button" @click="mode = 'reset'">Забыли пароль?</button></form>
        <form v-else-if="mode === 'sign-up'" @submit.prevent="signUp"><h1>Создать аккаунт</h1><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required /><input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="Пароль (минимум 8 символов)" required /><button :disabled="pending">Зарегистрироваться</button></form>
        <div v-else-if="mode === 'otp'"><form @submit.prevent="sendOtp"><h1>Войти по коду</h1><input name="email" type="email" placeholder="you@example.com" required /><button :disabled="pending">Отправить код</button></form><form v-if="otpSent" @submit.prevent="verifyOtp"><input name="email" type="email" placeholder="Тот же email" required /><input name="code" inputmode="numeric" placeholder="Код" required /><button :disabled="pending">Подтвердить</button></form></div>
        <div v-else><form v-if="!resetToken" @submit.prevent="requestReset"><h1>Сбросить пароль</h1><input name="email" type="email" placeholder="you@example.com" required /><button :disabled="pending">Отправить ссылку</button></form><form v-else @submit.prevent="resetPassword"><h1>Новый пароль</h1><input name="password" type="password" minlength="8" autocomplete="new-password" required /><button :disabled="pending">Сохранить пароль</button></form></div>
        <div class="alternatives"><button @click="signInWithPasskey" :disabled="pending">Войти с passkey</button><button @click="startOAuth('google')" :disabled="pending">Google</button><button @click="startOAuth('github')" :disabled="pending">GitHub</button><form @submit.prevent="startSso"><input name="email" type="email" autocomplete="email" placeholder="Рабочий email для SSO" required /><button :disabled="pending">Войти через SSO</button></form></div>
      </section>
      <section v-else-if="screen === 'account'" class="card"><h1>Ваш аккаунт</h1><dl><dt>Email</dt><dd>{{ session?.user.email }}</dd><dt>Уровень аутентификации</dt><dd>{{ session?.session.aal }}</dd><dt>Методы входа</dt><dd>{{ session?.session.amr.join(', ') }}</dd></dl><button @click="screen = 'security'; loadSecurity()">Настроить безопасность</button></section>
      <section v-else class="card"><h1>Безопасность</h1><div class="actions"><button @click="registerPasskey" :disabled="pending">Добавить passkey</button><button @click="enrollTotp" :disabled="pending">Подключить TOTP</button></div><div v-if="qrCode" class="qr" v-html="qrCode"></div><form v-if="enrollment" @submit.prevent="confirmTotp"><input name="code" inputmode="numeric" placeholder="Код из приложения" required /><button :disabled="pending">Подтвердить TOTP</button></form><div v-if="recoveryCodes.length"><h2>Коды восстановления</h2><code v-for="code in recoveryCodes" :key="code">{{ code }}</code></div><h2>Факторы</h2><p v-if="!factors.length">Дополнительных факторов пока нет.</p><ul><li v-for="factor in factors" :key="factor.id">{{ factor.name || factor.type }} · {{ factor.verified ? 'подтверждён' : 'ожидает подтверждения' }}</li></ul><h2>Passkeys</h2><p v-if="!passkeys.length">Passkey пока не добавлен.</p><ul><li v-for="passkey in passkeys" :key="passkey.id">{{ passkey.name || 'Без названия' }}</li></ul></section>
    </main>
  `,
}).mount('#app')
