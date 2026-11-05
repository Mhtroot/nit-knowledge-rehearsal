# Included in EVERY location: nginx drops server-level add_header lines in any
# location that defines its own add_header, so this must be repeated per location.
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy same-origin always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
add_header Strict-Transport-Security $hsts_header always;

# Content Security Policy:
# - Allows Vazirmatn font from Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
# - Allows local inline styles & scripts used for dynamic UI and animations
# - Allows images from data URIs and blob URLs for file upload previews
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: /assets/; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
