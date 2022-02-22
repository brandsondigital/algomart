import { RTL_LOCALES } from '@algomart/schemas'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SWRConfig } from 'swr'

import '../styles/globals.css'

import CookieConsent from '@/components/cookie-consent/cookie-consent'
import { AuthProvider } from '@/contexts/auth-context'
import { I18nProvider } from '@/contexts/i18n-context'
import { RedemptionProvider } from '@/contexts/redemption-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { useLocale } from '@/hooks/use-locale'
import { fetcher } from '@/utils/swr'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale }
    )
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    document.documentElement.dir = RTL_LOCALES.includes(locale.split('-')[0])
      ? 'rtl'
      : 'ltr'
  }, [locale])

  return (
    <SWRConfig value={{ fetcher }}>
      <RedemptionProvider>
        <AuthProvider>
          <I18nProvider>
            <ThemeProvider>
              <Component {...pageProps} />
              <CookieConsent />
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </RedemptionProvider>
    </SWRConfig>
  )
}

// Ensure we can use Next.js runtime configuration
MyApp.getInitialProps = () => ({})

export default MyApp
