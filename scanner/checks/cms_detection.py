import re
import requests

CMS_SIGNATURES = {
    "WordPress": [
        (r"wp-content", "body"),
        (r"wp-includes", "body"),
        (r'name="generator" content="WordPress', "body"),
    ],
    "Joomla": [
        (r'name="generator" content="Joomla', "body"),
        (r"/media/jui/", "body"),
    ],
    "Drupal": [
        (r'name="generator" content="Drupal', "body"),
        (r"sites/default/files", "body"),
        (r"drupal.js", "body"),
    ],
    "Magento": [
        (r"Mage.Cookies", "body"),
        (r"skin/frontend", "body"),
        (r"static/version", "body"),
    ],
    "Laravel": [
        (r"laravel_session", "cookie"),
        (r"XSRF-TOKEN", "cookie"),
    ],
    "CodeIgniter": [
        (r"ci_session", "cookie"),
    ],
    "React": [
        (r"__NEXT_DATA__", "body"),
        (r"id=\"root\"", "body"),
        (r"react-dom", "body"),
    ],
    "Angular": [
        (r"ng-version", "body"),
        (r"ng-app", "body"),
    ],
    "Vue": [
        (r"data-v-app", "body"),
        (r"__vue__", "body"),
    ],
    "ASP.NET": [
        (r"__VIEWSTATE", "body"),
        (r"ASP.NET_SessionId", "cookie"),
    ],
}

RECOMMENDATIONS = {
    "WordPress": "Follow WordPress hardening guidance (see Module 14): disable XML-RPC if unused, hide version info, restrict wp-admin access.",
    "Joomla": "Keep Joomla core, templates and extensions patched; restrict /administrator access by IP where possible.",
    "Drupal": "Keep Drupal core and modules patched; review file permissions on sites/default/settings.php.",
    "Magento": "Keep Magento patched; disable developer/debug mode in production; restrict admin path.",
    "Laravel": "Ensure APP_DEBUG=false and APP_ENV=production; rotate APP_KEY if ever exposed.",
    "CodeIgniter": "See Module 15 for CodeIgniter-specific hardening (APP_DEBUG, CSRF, session config).",
    "React": "Ensure source maps and API keys are not bundled into client-side code for production builds.",
    "Angular": "Build with production configuration to strip debug info and enable AOT compilation.",
    "Vue": "Build with production mode enabled to disable the Vue devtools hook.",
    "ASP.NET": "Disable custom errors/trace in production; remove X-AspNet-Version header.",
}


def check_cms_detection(url):
    """
    Module 13 - CMS Detection
    Passive detection using response body markers and cookie names only.
    """
    results = []

    try:
        response = requests.get(url, timeout=10)
    except requests.RequestException as error:
        return [{
            "module": "CMS Detection",
            "severity": "Low",
            "issue": f"Unable to fetch page for CMS detection: {error}",
            "recommendation": "Verify the site is reachable"
        }]

    body = response.text[:20000]
    cookie_names = " ".join(response.cookies.keys())

    detected = []
    for cms, signatures in CMS_SIGNATURES.items():
        for pattern, location in signatures:
            haystack = body if location == "body" else cookie_names
            if re.search(pattern, haystack, re.IGNORECASE):
                detected.append(cms)
                break

    if not detected:
        results.append({
            "module": "CMS Detection",
            "severity": "Info",
            "issue": "No known CMS or framework signature detected",
            "recommendation": "No action required"
        })
        return results

    for cms in detected:
        results.append({
            "module": "CMS Detection",
            "severity": "Info",
            "issue": f"{cms} detected",
            "recommendation": RECOMMENDATIONS.get(cms, "Keep the platform and its dependencies up to date"),
            "data": {"cms": cms}
        })

    return results