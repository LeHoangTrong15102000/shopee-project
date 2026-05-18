import crypto from 'crypto'

/**
 * Hash a JWT ID (JTI) using SHA-256.
 * Used to store a refreshTokenHash in the Session document for efficient lookup.
 */
export const hashJti = (jti: string): string => {
  return crypto.createHash('sha256').update(jti).digest('hex')
}

export interface ParsedUserAgent {
  browser: string
  os: string
  device: string
}

/**
 * Parse a User-Agent string into human-readable browser, OS, and device fields.
 * This is a lightweight parser — for portfolio use, accuracy over completeness.
 */
export const parseUserAgent = (ua: string): ParsedUserAgent => {
  if (!ua || ua.trim() === '') {
    return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' }
  }

  // Detect OS — check iPhone/iPad before Mac OS X (iOS UAs contain "Mac OS X")
  let os = 'Unknown'
  if (/Windows NT 10/.test(ua)) os = 'Windows 10'
  else if (/Windows NT 11/.test(ua)) os = 'Windows 11'
  else if (/Windows NT/.test(ua)) os = 'Windows'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Linux/.test(ua)) os = 'Linux'

  // Detect browser
  let browser = 'Unknown'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer'
  else if (/curl\//.test(ua)) browser = 'curl'
  else if (/PostmanRuntime/.test(ua)) browser = 'Postman'

  // Detect device type — check iPad/Tablet before Mobile (iPad UAs contain "Mobile")
  let device = 'Desktop'
  if (/iPad|Tablet/.test(ua)) device = 'Tablet'
  else if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile'
  else if (/bot|crawler|spider/i.test(ua)) device = 'Bot'

  return { browser, os, device }
}
