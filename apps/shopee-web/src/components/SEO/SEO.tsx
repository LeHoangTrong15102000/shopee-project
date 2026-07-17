import { Helmet } from 'react-helmet-async'
import config from 'src/constant/config'

const SITE_URL = config.siteUrl

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  keywords?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  locale?: string
  alternateLocales?: string[]
}

export default function SEO({
  title = 'ShopHub - Mua Sắm Online',
  description = 'Mua sắm trực tuyến hàng triệu sản phẩm ở tất cả ngành hàng. Giá tốt & Ưu đãi. Mua và bán online trong 30 giây. Đảm Bảo | Freeship Xtra | Hoàn Xu Xtra',
  image = '',
  url,
  type = 'website',
  keywords,
  noindex,
  jsonLd,
  locale,
  alternateLocales,
}: SEOProps) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const fullTitle = title.includes('ShopHub') ? title : `${title} | ShopHub`
  const effectiveKeywords = keywords ?? 'mua sắm online, shophub, thương mại điện tử'

  // Normalize JSON-LD to array
  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  // Build hreflang base URL (strip query params from current URL)
  const hreflangBase = currentUrl.split('?')[0]

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Robots directive */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="ShopHub" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="keywords" content={effectiveKeywords} />
      <meta name="author" content="ShopHub" />
      <link rel="canonical" href={currentUrl} />

      {/* hreflang alternate links */}
      {locale &&
        alternateLocales &&
        [locale, ...alternateLocales].map((lang) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={`${hreflangBase}?lang=${lang}`} />
        ))}
      {locale && alternateLocales && (
        <link rel="alternate" hrefLang="x-default" href={hreflangBase} />
      )}

      {/* JSON-LD Structured Data */}
      {jsonLdItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify({ '@context': 'https://schema.org', ...item })}
        </script>
      ))}
    </Helmet>
  )
}

export { SITE_URL }
