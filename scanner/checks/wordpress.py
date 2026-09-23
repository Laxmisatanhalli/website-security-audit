import re
import requests


def check_wordpress(url, detected_cms=None):
    """
    Module 14 - WordPress Security
    Only performs checks if WordPress was detected (or detection is skipped
    by the caller). All checks are non-intrusive GET requests to known,
    publicly-documented WordPress paths.
    """
    if detected_cms is not None and "WordPress" not in detected_cms:
        return []

    results = []
    base = url.rstrip("/")

    # XML-RPC
    try:
        resp = requests.post(base + "/xmlrpc.php", data="", timeout=8)
        if resp.status_code == 200 and "XML-RPC server accepts POST requests only" not in resp.text:
            results.append({
                "module": "WordPress Security",
                "severity": "Medium",
                "issue": "xmlrpc.php is enabled and reachable",
                "recommendation": "Disable XML-RPC if not needed (e.g. no Jetpack/mobile app use) to reduce brute-force and DDoS amplification risk",
                "fix": {
                    "apache": '<Files "xmlrpc.php">\n    Require all denied\n</Files>',
                    "nginx": 'location = /xmlrpc.php { deny all; }',
                    "wp_config": "add_filter('xmlrpc_enabled', '__return_false');"
                }
            })
    except requests.RequestException:
        pass

    # Debug mode / readme.html / version exposure
    try:
        resp = requests.get(base + "/readme.html", timeout=8)
        if resp.status_code == 200 and "wordpress" in resp.text.lower():
            version_match = re.search(r"version\s+([\d.]+)", resp.text, re.IGNORECASE)
            version_info = f" (version {version_match.group(1)})" if version_match else ""
            results.append({
                "module": "WordPress Security",
                "severity": "Low",
                "issue": f"readme.html is accessible, exposing WordPress version info{version_info}",
                "recommendation": "Remove or block access to readme.html",
                "fix": {
                    "apache": '<Files "readme.html">\n    Require all denied\n</Files>',
                    "nginx": 'location = /readme.html { deny all; }'
                }
            })
    except requests.RequestException:
        pass

    # wp-login.php default path
    try:
        resp = requests.get(base + "/wp-login.php", timeout=8)
        if resp.status_code == 200:
            results.append({
                "module": "WordPress Security",
                "severity": "Low",
                "issue": "Default wp-login.php path is reachable",
                "recommendation": "Consider renaming the login path with a security plugin and enforcing rate limiting / 2FA",
                "fix": {
                    "apache": "# Rate-limit with mod_evasive or move login path via a plugin",
                    "wp_config": "// Enforce strong passwords and 2FA via a vetted security plugin"
                }
            })
    except requests.RequestException:
        pass

    # Plugin/theme enumeration via readable directory listing
    for path, label in [("/wp-content/plugins/", "plugin"), ("/wp-content/themes/", "theme")]:
        try:
            resp = requests.get(base + path, timeout=8)
            if resp.status_code == 200 and ("index of" in resp.text.lower() or "parent directory" in resp.text.lower()):
                results.append({
                    "module": "WordPress Security",
                    "severity": "Medium",
                    "issue": f"{label.capitalize()} directory listing is enabled at {path}",
                    "recommendation": f"Disable directory listing to prevent {label} enumeration",
                    "fix": {
                        "apache": "Options -Indexes",
                        "nginx": "autoindex off;"
                    }
                })
        except requests.RequestException:
            continue

    # Upload directory should not allow PHP execution
    try:
        resp = requests.get(base + "/wp-content/uploads/", timeout=8)
        if resp.status_code == 200 and ("index of" in resp.text.lower()):
            results.append({
                "module": "WordPress Security",
                "severity": "Medium",
                "issue": "Uploads directory listing is enabled",
                "recommendation": "Disable directory listing and block PHP execution inside the uploads directory",
                "fix": {
                    "apache": 'Options -Indexes\n<Directory "/wp-content/uploads/">\n    <FilesMatch "\\.php$">\n        Require all denied\n    </FilesMatch>\n</Directory>',
                    "nginx": 'location ~* /wp-content/uploads/.*\\.php$ { deny all; }'
                }
            })
    except requests.RequestException:
        pass

    if not results:
        results.append({
            "module": "WordPress Security",
            "severity": "Info",
            "issue": "No common WordPress misconfigurations detected in this non-intrusive check",
            "recommendation": "Continue applying core/plugin/theme updates and standard hardening"
        })

    return results