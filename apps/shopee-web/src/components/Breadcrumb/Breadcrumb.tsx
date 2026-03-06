import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { fadeIn } from 'src/styles/animations'

export interface BreadcrumbItem {
  label: string
  to?: string // If undefined, it's the current page (no link)
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumb = ({ items, className = '' }: BreadcrumbProps) => {
  const reducedMotion = useReducedMotion()

  // Generate JSON-LD structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.to && { item: `${typeof window !== 'undefined' ? window.location.origin : ''}${item.to}` })
    }))
  }

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <motion.nav
        aria-label='Breadcrumb'
        className={`mb-4 text-sm ${className}`}
        variants={reducedMotion ? undefined : fadeIn}
        initial={reducedMotion ? undefined : 'hidden'}
        animate={reducedMotion ? undefined : 'visible'}
      >
        <ol className='flex items-center gap-2'>
          {items.map((item, index) => {
            const isLastItem = index === items.length - 1

            return (
              <li key={index} className='flex items-center gap-2'>
                {/* Separator (not for first item) */}
                {index > 0 && <span className='text-gray-400 dark:text-gray-500'>/</span>}

                {/* Breadcrumb item */}
                {isLastItem || !item.to ? (
                  // Current page (last item) - no link
                  <span
                    className='font-medium text-gray-800 dark:text-gray-200'
                    aria-current={isLastItem ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  // Link item
                  <Link
                    to={item.to}
                    className='text-gray-500 transition-colors hover:text-orange dark:text-gray-400 dark:hover:text-orange-400'
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </motion.nav>
    </>
  )
}

export default Breadcrumb
