import requests


def check_cloudflare_passive(headers):
    """
    Module - Cloudflare Detection (Passive)
    Checks whether the site is fronted by Cloudflare using only response
    headers. Returns a single finding (not a list), since scanner.py
    appends it directly.
    """
    headers_lower = {k.lower(): v for k, v in headers.items()}
    server = headers_lower.get("server", "").lower()
    is_cloudflare = "cloudflare" in server or "cf-ray" in headers_lower or "cf-cache-status" in headers_lower

    if is_cloudflare:
        return {
            "module": "Cloudflare",
            "severity": "Info",
            "issue": "Site appears to be behind Cloudflare",
            "recommendation": "Ensure the origin server's real IP is not exposed elsewhere (DNS history, subdomains, direct-access headers)"
        }

    return {
        "module": "Cloudflare",
        "severity": "Info",
        "issue": "No Cloudflare fronting was detected",
        "recommendation": "Consider a CDN/WAF such as Cloudflare for DDoS protection and edge caching"
    }


def check_cloudflare_api(cf_zone_id, cf_api_token):
    """
    Module - Cloudflare Configuration (Active, API)
    Only runs if the caller supplied a Cloudflare zone ID and API token for
    this website. Checks a handful of zone security settings via the
    Cloudflare API.
    """
    results = []

    if not cf_zone_id or not cf_api_token:
        return results

    headers = {"Authorization": f"Bearer {cf_api_token}", "Content-Type": "application/json"}

    try:
        resp = requests.get(
            f"https://api.cloudflare.com/client/v4/zones/{cf_zone_id}/settings",
            headers=headers, timeout=10
        )
        if resp.status_code != 200:
            results.append({
                "module": "Cloudflare",
                "severity": "Low",
                "issue": "Could not read Cloudflare zone settings, check API token permissions",
                "recommendation": "Grant the API token 'Zone Settings: Read' permission for this zone"
            })
            return results

        settings = {item["id"]: item["value"] for item in resp.json().get("result", [])}

        if settings.get("ssl") not in ("strict", "full_strict"):
            results.append({
                "module": "Cloudflare",
                "severity": "Medium",
                "issue": f"SSL mode is set to '{settings.get('ssl')}' rather than Full (Strict)",
                "recommendation": "Set SSL/TLS encryption mode to Full (Strict) in the Cloudflare dashboard"
            })

        if settings.get("always_use_https") != "on":
            results.append({
                "module": "Cloudflare",
                "severity": "Medium",
                "issue": "Always Use HTTPS is disabled",
                "recommendation": "Enable 'Always Use HTTPS' to force redirect all HTTP traffic"
            })

        if str(settings.get("min_tls_version", "1.0")) < "1.2":
            results.append({
                "module": "Cloudflare",
                "severity": "Medium",
                "issue": f"Minimum TLS version is set to {settings.get('min_tls_version')}",
                "recommendation": "Raise the minimum TLS version to 1.2 or higher"
            })

    except requests.RequestException as error:
        results.append({
            "module": "Cloudflare",
            "severity": "Low",
            "issue": f"Could not contact Cloudflare API: {error}",
            "recommendation": "Verify network connectivity and API credentials"
        })

    return results