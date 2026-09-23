import requests

# path -> (severity, description)
SENSITIVE_PATHS = {
    "/.env": ("Critical", "Environment file exposing secrets/credentials"),
    "/.git/config": ("Critical", "Exposed .git repository metadata"),
    "/.git/HEAD": ("Critical", "Exposed .git repository metadata"),
    "/.svn/entries": ("High", "Exposed .svn repository metadata"),
    "/composer.json": ("Medium", "Composer dependency manifest exposed"),
    "/composer.lock": ("Medium", "Composer lock file exposed (reveals exact dependency versions)"),
    "/package.json": ("Low", "package.json exposed"),
    "/package-lock.json": ("Low", "package-lock.json exposed"),
    "/phpinfo.php": ("Critical", "phpinfo() page exposed"),
    "/backup.zip": ("Critical", "Backup archive exposed"),
    "/backup.tar": ("Critical", "Backup archive exposed"),
    "/backup.tar.gz": ("Critical", "Backup archive exposed"),
    "/backup.sql": ("Critical", "Database backup exposed"),
    "/database.sql": ("Critical", "Database dump exposed"),
    "/db.sql": ("Critical", "Database dump exposed"),
    "/config.php.bak": ("Critical", "Backup of configuration file exposed"),
    "/web.config.bak": ("Critical", "Backup of IIS configuration exposed"),
    "/wp-config.php.bak": ("Critical", "Backup of WordPress config exposed"),
    "/README.md": ("Info", "Readme file present (usually low risk)"),
    "/CHANGELOG.md": ("Info", "Changelog file present"),
    "/debug.log": ("High", "Debug log file exposed, may contain sensitive data"),
    "/error_log": ("Medium", "Server error log exposed"),
}

BINARY_SIGNATURES = (b"PK\x03\x04", b"\x1f\x8b")  # zip, gzip


def _looks_like_default_page(text):
    lowered = text.lower()
    return "404" in lowered or "not found" in lowered or len(text.strip()) == 0


def check_sensitive_files(url):
    """
    Module 6 - Sensitive File Exposure
    Non-intrusive HEAD/GET checks for common sensitive file paths.
    """
    results = []
    base = url.rstrip("/")

    for path, (severity, description) in SENSITIVE_PATHS.items():
        target = base + path
        try:
            response = requests.get(target, timeout=8, allow_redirects=False, stream=True)
        except requests.RequestException:
            continue

        if response.status_code != 200:
            continue

        chunk = response.raw.read(64, decode_content=True) or b""
        is_binary = any(chunk.startswith(sig) for sig in BINARY_SIGNATURES)

        if not is_binary:
            try:
                text_preview = response.text[:500]
            except Exception:
                text_preview = ""
            if _looks_like_default_page(text_preview):
                continue

        results.append({
            "module": "Sensitive File Exposure",
            "severity": severity,
            "issue": f"{description} at {path}",
            "recommendation": f"Block public access to {path} and remove it from the web root if not needed",
            "fix": {
                "apache": f'<FilesMatch "{path.split("/")[-1]}">\n    Require all denied\n</FilesMatch>',
                "nginx": f'location = {path} {{ deny all; return 404; }}',
                "htaccess": f'<Files "{path.split("/")[-1]}">\n    Require all denied\n</Files>'
            }
        })

    if not results:
        results.append({
            "module": "Sensitive File Exposure",
            "severity": "Info",
            "issue": "No commonly exposed sensitive files detected",
            "recommendation": "No action required"
        })

    return results