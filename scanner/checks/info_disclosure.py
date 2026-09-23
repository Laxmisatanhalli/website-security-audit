import re
import requests


VERSION_PATTERN = re.compile(r"[\d]+\.[\d]+(\.[\d]+)?")


def _finding(header, value, severity="Medium"):
    return {
        "module": "Information Disclosure",
        "severity": severity,
        "issue": f"{header} header exposes: {value}",
        "recommendation": f"Remove or mask the {header} header to avoid revealing software/version details",
        "fix": {
            "apache": "ServerTokens Prod\nServerSignature Off\nHeader unset X-Powered-By",
            "nginx": "server_tokens off;\nmore_clear_headers 'X-Powered-By';",
            "php_ini": "expose_php = Off"
        }
    }


def check_info_disclosure(headers):
    """
    Module 4 - Information Disclosure
    """
    results = []

    server = headers.get("Server")
    if server:
        has_version = bool(VERSION_PATTERN.search(server))
        results.append(_finding("Server", server, "High" if has_version else "Medium"))

    powered_by = headers.get("X-Powered-By")
    if powered_by:
        results.append(_finding("X-Powered-By", powered_by, "Medium"))

    aspnet_version = headers.get("X-AspNet-Version")
    if aspnet_version:
        results.append(_finding("X-AspNet-Version", aspnet_version, "High"))

    aspnetmvc_version = headers.get("X-AspNetMvc-Version")
    if aspnetmvc_version:
        results.append(_finding("X-AspNetMvc-Version", aspnetmvc_version, "Medium"))

    via = headers.get("Via")
    if via:
        results.append(_finding("Via", via, "Low"))

    if not results:
        results.append({
            "module": "Information Disclosure",
            "severity": "Info",
            "issue": "No version-revealing headers detected",
            "recommendation": "No action required"
        })

    return results


def check_phpinfo_exposure(url):
    """Best-effort, non-intrusive check for an exposed phpinfo() page."""
    results = []
    candidates = ["/phpinfo.php", "/info.php", "/test.php"]
    base = url.rstrip("/")

    for path in candidates:
        try:
            response = requests.get(base + path, timeout=8)
            if response.status_code == 200 and "phpinfo()" in response.text.lower():
                results.append({
                    "module": "Information Disclosure",
                    "severity": "Critical",
                    "issue": f"Exposed PHP info page detected at {path}",
                    "recommendation": "Remove phpinfo() pages from production, they reveal full server configuration"
                })
        except requests.RequestException:
            continue

    return results