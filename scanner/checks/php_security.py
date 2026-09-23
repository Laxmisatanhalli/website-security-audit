def check_php_security(url, headers, page_body=None):
    """
    Module - PHP Security
    Checks PHP version disclosure via headers, phpinfo()-style leaks in the
    page body, and visible PHP error output that suggests debug mode is on.
    """
    results = []
    headers_lower = {k.lower(): v for k, v in headers.items()}

    x_powered_by = headers_lower.get("x-powered-by", "")
    if "php" in x_powered_by.lower():
        results.append({
            "module": "PHP Security",
            "severity": "Low",
            "issue": f"PHP version disclosed via X-Powered-By header: {x_powered_by}",
            "recommendation": "Set `expose_php = Off` in php.ini to stop advertising the PHP version"
        })

    if page_body:
        body_lower = page_body.lower()

        if "phpinfo()" in body_lower or ("php version" in body_lower and "system" in body_lower):
            results.append({
                "module": "PHP Security",
                "severity": "Critical",
                "issue": "Page content resembles a phpinfo() output, which discloses detailed server configuration",
                "recommendation": "Remove phpinfo() calls and any debug/info pages from production"
            })

        if "fatal error" in body_lower or ("warning:" in body_lower and ".php on line" in body_lower):
            results.append({
                "module": "PHP Security",
                "severity": "High",
                "issue": "PHP error output is visible on the page, indicating display_errors is enabled",
                "recommendation": "Set `display_errors = Off` and `log_errors = On` in production"
            })

    if not results:
        results.append({
            "module": "PHP Security",
            "severity": "Info",
            "issue": "No obvious PHP misconfigurations were detected",
            "recommendation": "No action required"
        })

    return results