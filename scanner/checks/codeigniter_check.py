import requests


def check_codeigniter(url, detected_cms=None):
    """
    Module - CodeIgniter Security
    Runs only when CMS Detection has flagged CodeIgniter, to avoid noisy
    false positives on sites that aren't running it. Checks for exposed
    .env/config files, leftover default pages, and debug-mode error
    disclosure common to CodeIgniter deployments.
    """
    results = []

    if detected_cms is not None and "CodeIgniter" not in detected_cms:
        return results

    base = url.rstrip("/")

    exposure_checks = [
        ("/.env", "Environment file (.env) is publicly accessible", "Critical"),
        ("/application/config/config.php", "CodeIgniter config file is publicly accessible", "Critical"),
        ("/index.php/welcome", "Default CodeIgniter welcome page is still accessible", "Medium"),
    ]

    for path, issue, severity in exposure_checks:
        try:
            resp = requests.get(base + path, timeout=8)
            if resp.status_code == 200:
                results.append({
                    "module": "CodeIgniter Security",
                    "severity": severity,
                    "issue": issue,
                    "recommendation": f"Restrict or remove public access to {path}"
                })
        except requests.RequestException:
            continue

    # Debug mode / error disclosure
    try:
        resp = requests.get(base + "/this-path-should-not-exist-xyz123", timeout=8)
        if resp.status_code == 500 and ("codeigniter" in resp.text.lower() or "fatal error" in resp.text.lower()):
            results.append({
                "module": "CodeIgniter Security",
                "severity": "High",
                "issue": "Detailed error messages are exposed, CodeIgniter may be running with debug mode enabled",
                "recommendation": "Set CI_ENVIRONMENT to 'production' and disable detailed error display"
            })
    except requests.RequestException:
        pass

    if not results:
        results.append({
            "module": "CodeIgniter Security",
            "severity": "Info",
            "issue": "No common CodeIgniter misconfigurations were found",
            "recommendation": "No action required"
        })

    return results