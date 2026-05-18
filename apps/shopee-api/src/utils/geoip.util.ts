import geoip from 'geoip-lite'

export interface GeoLocation {
  country: string
  city: string
}

/**
 * Look up the geographic location for an IP address using the bundled geoip-lite database.
 * Returns null for private/loopback IPs or when the IP is not found in the database.
 *
 * Note: geoip-lite uses a bundled offline database. Run `npm run update-geoip` to refresh it.
 * Location is informational only — not used for access control.
 */
export const getLocation = (ip: string): GeoLocation | null => {
  if (!ip || ip === 'unknown') return null

  // Skip private/loopback addresses
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  ) {
    return null
  }

  try {
    const geo = geoip.lookup(ip)
    if (!geo) return null

    return {
      country: geo.country || 'Unknown',
      city: geo.city || 'Unknown',
    }
  } catch {
    return null
  }
}

/**
 * Format a GeoLocation as a human-readable string.
 */
export const formatLocation = (location: GeoLocation | null): string => {
  if (!location) return 'Unknown'
  if (location.city && location.city !== 'Unknown') {
    return `${location.city}, ${location.country}`
  }
  return location.country || 'Unknown'
}
