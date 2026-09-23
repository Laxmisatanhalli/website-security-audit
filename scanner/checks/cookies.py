import requests


def check_cookies(url):
    """
    Module 3 - Cookie Security
    Non-intrusive check of Set-Cookie headers returned on the initial response.
    """
    results = []

    try:
        response = requests.get(url, timeout=10, allow_redirects=True)
    except requests.RequestException as error:
        return [{
            "module": "Cookie Security",
            "severity": "Medium",
            "issue": f"Unable to fetch cookies: {error}",
            "recommendation": "Check that the website is reachable"
        }]

    raw_cookies = response.raw.headers.get_all("Set-Cookie") if hasattr(response.raw.headers, "get_all") else None
    if raw_cookies is None:
        raw_cookies = response.headers.get("Set-Cookie")
        raw_cookies = [raw_cookies] if raw_cookies else []

    if not raw_cookies:
        results.append({
            "module": "Cookie Security",
            "severity": "Info",
            "issue": "No cookies were set on the initial response",
            "recommendation": "No action required"
        })
        return results

    for raw in raw_cookies:
        name = raw.split("=", 1)[0].strip()
        lower = raw.lower()

        if "secure" not in lower and url.startswith("https"):
            results.append({
                "module": "Cookie Security",
                "severity": "High",
                "issue": f"Cookie '{name}' is missing the Secure flag",
                "recommendation": "Set the Secure attribute so the cookie is only sent over HTTPS",
                "fix": {
                    "php": "session_set_cookie_params(['secure' => true, 'httponly' => true, 'samesite' => 'Strict']);",
                    "apache": "Header edit Set-Cookie ^(.*)$ $1;Secure",
                    "nginx": 'proxy_cookie_flags ~ secure;'
                }
            })

        if "httponly" not in lower:
            results.append({
                "module": "Cookie Security",
                "severity": "High",
                "issue": f"Cookie '{name}' is missing the HttpOnly flag",
                "recommendation": "Set HttpOnly so client-side scripts cannot read the cookie",
                "fix": {
                    "php": "ini_set('session.cookie_httponly', 1);",
                    "apache": "Header edit Set-Cookie ^(.*)$ $1;HttpOnly",
                    "nginx": 'proxy_cookie_flags ~ httponly;'
                }
            })

        if "samesite" not in lower:
            results.append({
                "module": "Cookie Security",
                "severity": "Medium",
                "issue": f"Cookie '{name}' does not set a SameSite attribute",
                "recommendation": "Set SameSite=Strict or SameSite=Lax to reduce CSRF risk",
                "fix": {
                    "php": "ini_set('session.cookie_samesite', 'Strict');",
                    "apache": "Header edit Set-Cookie ^(.*)$ $1;SameSite=Strict"
                }
            })
        elif "samesite=none" in lower and "secure" not in lower:
            results.append({
                "module": "Cookie Security",
                "severity": "High",
                "issue": f"Cookie '{name}' uses SameSite=None without Secure",
                "recommendation": "SameSite=None requires the Secure attribute to be set"
            })

        if "expires" not in lower and "max-age" not in lower:
            results.append({
                "module": "Cookie Security",
                "severity": "Low",
                "issue": f"Cookie '{name}' is a persistent-less (session) cookie with no explicit expiry",
                "recommendation": "Confirm this is intentional for session cookies; set Max-Age for cookies that should persist"
            })

        session_name_hints = ("phpsessid", "sessionid", "jsessionid", "asp.net_sessionid")
        if name.lower() in session_name_hints and "httponly" in lower and "secure" in lower:
            results.append({
                "module": "Cookie Security",
                "severity": "Info",
                "issue": f"Session cookie '{name}' has Secure and HttpOnly set",
                "recommendation": "No action required"
            })

    if not results:
        results.append({
            "module": "Cookie Security",
            "severity": "Info",
            "issue": "Cookies present and appear correctly flagged",
            "recommendation": "No action required"
        })

    return results