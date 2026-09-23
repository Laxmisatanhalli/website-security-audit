import requests

INDEX_SIGNATURES = (
    "index of /",
    "<title>index of",
    "directory listing for",
    "parent directory</a>",
)

COMMON_DIRS = [
    "/",
    "/uploads/",
    "/images/",
    "/assets/",
    "/backup/",
    "/backups/",
    "/files/",
    "/tmp/",
    "/logs/",
]


def check_directory_listing(url):
    """
    Module 5 - Directory Listing
    Non-intrusive: requests common directory paths and checks for
    autoindex-style responses. Does not attempt to enumerate contents.
    """
    results = []
    base = url.rstrip("/")

    for path in COMMON_DIRS:
        target = base + path
        try:
            response = requests.get(target, timeout=8, allow_redirects=True)
        except requests.RequestException:
            continue

        if response.status_code != 200:
            continue

        body_lower = response.text.lower()[:5000]
        if any(sig in body_lower for sig in INDEX_SIGNATURES):
            severity = "High" if path in ("/uploads/", "/backup/", "/backups/") else "Medium"
            results.append({
                "module": "Directory Listing",
                "severity": severity,
                "issue": f"Directory listing (autoindex) appears enabled at {path}",
                "recommendation": "Disable directory listing for this path",
                "fix": {
                    "apache": "Options -Indexes",
                    "nginx": "autoindex off;",
                    "htaccess": "Options -Indexes\nIndexIgnore *"
                }
            })

    if not results:
        results.append({
            "module": "Directory Listing",
            "severity": "Info",
            "issue": "No directory listing detected on common paths checked",
            "recommendation": "No action required"
        })

    return results