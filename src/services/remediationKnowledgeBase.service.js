/**
 * Section 8 - Remediation Knowledge Base.
 * Each entry follows the scope's required shape: description, cause, impact,
 * step-by-step solution, and platform-specific configuration where relevant.
 * Keyed by scanner module name. This is intentionally template-level (one
 * entry per module, not per exact issue string) since the scanner produces
 * many issue variants per module; entries are written generically enough to
 * apply to any finding from that module.
 */
const KNOWLEDGE_BASE = {
  'Security Headers': {
    description: 'One or more recommended HTTP security headers are missing or misconfigured.',
    cause: 'The web server or application was not configured to send these headers by default.',
    impact: 'Increases exposure to clickjacking, XSS, MIME-sniffing, and data-leak attacks.',
    steps: [
      'Identify which headers are missing from the scan findings.',
      'Add the headers at the web server or application layer.',
      'Re-scan to confirm the headers are now present with expected values.',
    ],
    apache: 'Header always set X-Content-Type-Options "nosniff"\nHeader always set X-Frame-Options "SAMEORIGIN"\nHeader always set Referrer-Policy "strict-origin-when-cross-origin"',
    nginx: 'add_header X-Content-Type-Options "nosniff" always;\nadd_header X-Frame-Options "SAMEORIGIN" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    htaccess: 'Header always set X-Content-Type-Options "nosniff"',
    codeigniter: "// app/Config/Filters.php - add a header-setting filter, or set headers directly in Controllers via $this->response->setHeader(...)",
    documentation: 'https://owasp.org/www-project-secure-headers/',
  },

  'SSL/TLS': {
    description: 'The SSL/TLS certificate or configuration does not meet best practices.',
    cause: 'Certificate nearing/past expiry, or the server is configured to allow outdated protocols/ciphers.',
    impact: 'Expired or weak TLS exposes traffic to interception and erodes user/browser trust.',
    steps: [
      'Renew the certificate if expiring or expired.',
      'Disable TLS 1.0/1.1 and weak cipher suites at the web server.',
      'Enable HSTS once HTTPS is confirmed working on all subdomains.',
    ],
    apache: 'SSLProtocol -all +TLSv1.2 +TLSv1.3\nSSLCipherSuite HIGH:!aNULL:!MD5',
    nginx: 'ssl_protocols TLSv1.2 TLSv1.3;\nssl_ciphers HIGH:!aNULL:!MD5;',
    linux: 'certbot renew --dry-run   # test renewal\ncertbot renew             # renew all due certificates',
    documentation: 'https://ssl-config.mozilla.org/',
  },

  'Cookie Security': {
    description: 'Cookies are missing Secure, HttpOnly, or SameSite attributes.',
    cause: 'Session/cookie configuration at the application or framework layer does not set these flags.',
    impact: 'Cookies can be intercepted over unencrypted connections or accessed via client-side script, enabling session hijacking.',
    steps: [
      'Set Secure and HttpOnly on all session cookies.',
      'Set SameSite=Strict or Lax unless cross-site cookies are explicitly required.',
      'Re-test in a browser to confirm flags are applied.',
    ],
    php: "session_set_cookie_params(['secure' => true, 'httponly' => true, 'samesite' => 'Strict']);",
    codeigniter: "// app/Config/Cookie.php\npublic bool $secure = true;\npublic bool $httponly = true;\npublic string $samesite = 'Strict';",
    documentation: 'https://owasp.org/www-community/controls/SecureCookieAttribute',
  },

  'Information Disclosure': {
    description: 'Server or application headers reveal software names and/or version numbers.',
    cause: 'Default server configuration exposes Server/X-Powered-By headers.',
    impact: 'Gives attackers a head start identifying known vulnerabilities for the exact software version in use.',
    steps: [
      'Suppress or generalize identifying headers at the web server.',
      'Disable framework-level version disclosure (e.g. expose_php).',
      'Repeat for any staging/backup environments, not just production.',
    ],
    apache: 'ServerTokens Prod\nServerSignature Off',
    nginx: 'server_tokens off;',
    php_ini: 'expose_php = Off',
    documentation: 'https://owasp.org/www-project-web-security-testing-guide/',
  },

  'Directory Listing': {
    description: 'Directory listing (autoindex) is enabled on one or more paths.',
    cause: 'The web server was not explicitly configured to disable directory browsing.',
    impact: 'Allows attackers to browse the file structure and discover files not meant to be public.',
    steps: [
      'Disable directory indexing globally and per-directory where relevant.',
      'Add an index file to directories that must remain accessible.',
    ],
    apache: 'Options -Indexes',
    nginx: 'autoindex off;',
    htaccess: 'Options -Indexes\nIndexIgnore *',
    documentation: 'https://owasp.org/www-community/vulnerabilities/Directory_indexing',
  },

  'Sensitive File Exposure': {
    description: 'A file that should not be publicly accessible (backups, VCS metadata, env files) was reachable.',
    cause: 'Deployment process leaves development/build artifacts in the web root without access restrictions.',
    impact: 'Can expose credentials, source code, or full database dumps directly to the internet.',
    steps: [
      'Remove the file from the web root, or move it outside the document root entirely.',
      'Add explicit deny rules for the file pattern as defense in depth.',
      'Audit deployment scripts so this class of file is never copied into the web root.',
    ],
    apache: '<FilesMatch "\\.(env|sql|bak|zip|tar|git)$">\n    Require all denied\n</FilesMatch>',
    nginx: 'location ~* \\.(env|sql|bak|zip|tar)$ { deny all; return 404; }',
    documentation: 'https://owasp.org/www-project-top-ten/',
  },

  'HTTP Methods': {
    description: 'HTTP methods beyond what the application needs are enabled (e.g. PUT, DELETE, TRACE).',
    cause: 'Default web server configuration allows all standard HTTP methods.',
    impact: 'Unused methods expand the attack surface, e.g. TRACE can enable Cross-Site Tracing.',
    steps: [
      'Restrict allowed methods to only those the application requires, typically GET, POST, HEAD.',
      'Confirm the application still functions correctly after restricting methods.',
    ],
    apache: '<LimitExcept GET POST HEAD>\n    Require all denied\n</LimitExcept>',
    nginx: 'if ($request_method !~ ^(GET|POST|HEAD)$) { return 405; }',
    documentation: 'https://owasp.org/www-project-web-security-testing-guide/',
  },

  'Redirect Analysis': {
    description: 'HTTP traffic is not being redirected to HTTPS, or a redirect loop/long chain was detected.',
    cause: 'No enforced redirect rule from port 80 to the HTTPS site, or conflicting redirect rules.',
    impact: 'Traffic sent to the HTTP version stays unencrypted, exposing it to interception.',
    steps: [
      'Add a server block/vhost rule that permanently redirects HTTP to HTTPS.',
      'Test with curl -IL to confirm a single 301 to the HTTPS URL.',
    ],
    apache: 'RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    nginx: 'server {\n    listen 80;\n    return 301 https://$host$request_uri;\n}',
    documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections',
  },

  'DNS Security': {
    description: 'DNS-layer protections (SPF, DMARC, CAA, DNSSEC) are missing or incomplete.',
    cause: 'These records were never published with the DNS provider.',
    impact: 'Weakens defenses against email spoofing, unauthorized certificate issuance, and DNS cache poisoning.',
    steps: [
      'Publish the missing DNS TXT/CAA records with your DNS provider.',
      'Enable DNSSEC if supported by your registrar and DNS host.',
      'Re-check propagation after 24-48 hours before re-scanning.',
    ],
    dns: 'TXT  "v=spf1 include:_spf.example.com ~all"\nTXT  _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"\nCAA  0 issue "letsencrypt.org"',
    documentation: 'https://www.cloudflare.com/learning/dns/dns-security/',
  },

  'Email Security': {
    description: 'Email authentication records (SPF/DKIM) could not be confirmed.',
    cause: 'SPF/DKIM was never configured with the email provider, or uses a non-standard selector.',
    impact: 'Increases the likelihood of successful email spoofing using your domain.',
    steps: [
      'Confirm SPF is published and includes all legitimate sending sources.',
      'Configure DKIM signing with your email provider and publish the selector record.',
      'Move DMARC policy from none to quarantine/reject once monitoring shows no false positives.',
    ],
    dns: 'See DNS Security entry above for SPF/DMARC record syntax.',
    documentation: 'https://dmarc.org/overview/',
  },

  'Performance & Optimization': {
    description: 'Compression, caching, or protocol-level performance settings are not fully enabled.',
    cause: 'Default server configuration does not enable compression/caching/HTTP2.',
    impact: 'Slower load times increase bounce rate and can indirectly affect SEO ranking.',
    steps: [
      'Enable gzip/Brotli compression for text-based assets.',
      'Set Cache-Control headers for static assets.',
      'Enable HTTP/2 (or HTTP/3 where supported).',
    ],
    apache: 'LoadModule deflate_module modules/mod_deflate.so\nAddOutputFilterByType DEFLATE text/html text/css application/javascript\nProtocols h2 http/1.1',
    nginx: 'gzip on;\ngzip_types text/plain text/css application/javascript application/json;\nlisten 443 ssl http2;',
    documentation: 'https://web.dev/fast/',
  },

  'CMS Detection': {
    description: 'A specific CMS or frontend framework was identified.',
    cause: 'N/A - informational finding.',
    impact: 'Informs which platform-specific hardening checklist applies (see WordPress Security, etc.).',
    steps: ['No direct action required; use this to select the relevant hardening checklist.'],
    documentation: 'https://owasp.org/www-project-top-ten/',
  },

  'WordPress Security': {
    description: 'A WordPress-specific misconfiguration was detected.',
    cause: 'Default WordPress installation settings, or a missing hardening step.',
    impact: 'Ranges from information disclosure (version/plugin enumeration) to brute-force/DDoS amplification via XML-RPC.',
    steps: [
      'Apply the specific fix noted in the finding (e.g. disable XML-RPC, remove readme.html).',
      'Keep WordPress core, plugins, and themes updated.',
      'Install a reputable security plugin for login hardening and 2FA.',
    ],
    apache: '<Files "xmlrpc.php">\n    Require all denied\n</Files>',
    nginx: 'location = /xmlrpc.php { deny all; }',
    wp_config: "add_filter('xmlrpc_enabled', '__return_false');",
    documentation: 'https://wordpress.org/documentation/article/hardening-wordpress/',
  },
};

const DEFAULT_ENTRY = {
  description: 'Review the finding details for this module.',
  cause: 'Not module-specific; see the individual finding.',
  impact: 'See severity rating on the finding.',
  steps: ['Review the recommendation attached to this finding and apply the suggested fix.'],
  documentation: 'https://owasp.org/www-project-top-ten/',
};

function getRemediationSteps(module) {
  return KNOWLEDGE_BASE[module] || DEFAULT_ENTRY;
}

module.exports = { getRemediationSteps, KNOWLEDGE_BASE };
