def generate_apache_vhost(results, hostname):
    """
    Builds a hardened Apache vhost config snippet as a suggested fix,
    informed by the findings already gathered earlier in the scan.
    """
    header_lines = [
        'Header always set X-Content-Type-Options "nosniff"',
        'Header always set X-Frame-Options "SAMEORIGIN"',
        'Header always set Referrer-Policy "strict-origin-when-cross-origin"',
        'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
    ]

    lines = [
        "<VirtualHost *:443>",
        f"    ServerName {hostname}",
        "    SSLEngine on",
        "    SSLProtocol -all +TLSv1.2 +TLSv1.3",
        "    ServerTokens Prod",
        "    ServerSignature Off",
        "    TraceEnable Off",
    ]
    lines.extend(f"    {h}" for h in header_lines)
    lines.append("</VirtualHost>")

    return "\n".join(lines) + "\n"


def generate_nginx_server_block(results, hostname):
    """
    Builds a hardened Nginx server block snippet as a suggested fix.
    """
    lines = [
        "server {",
        "    listen 443 ssl http2;",
        f"    server_name {hostname};",
        "    ssl_protocols TLSv1.2 TLSv1.3;",
        "    server_tokens off;",
        '    add_header X-Content-Type-Options "nosniff" always;',
        '    add_header X-Frame-Options "SAMEORIGIN" always;',
        '    add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
        '    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
        "}",
    ]
    return "\n".join(lines) + "\n"


def audit_apache(results, generated_config=None):
    """
    Module - Apache Configuration Audit
    Summarizes findings relevant to server hardening and attaches a
    generated, hardened vhost config as a suggested fix. Returns a single
    finding since scanner.py appends it directly.
    """
    related_issues = [r["issue"] for r in results if r.get("severity") in ("Medium", "High", "Critical")]

    return {
        "module": "Apache Configuration",
        "severity": "Medium" if related_issues else "Info",
        "issue": (
            "Suggested hardened Apache configuration generated based on this scan's findings"
            if related_issues else
            "No Apache-specific issues detected; a baseline hardened config is provided for reference"
        ),
        "recommendation": "Review and adapt the generated vhost config below for your Apache setup",
        "data": {"config": generated_config}
    }


def audit_nginx(results, generated_config=None):
    """
    Module - Nginx Configuration Audit
    Same idea as audit_apache, for Nginx server blocks.
    """
    related_issues = [r["issue"] for r in results if r.get("severity") in ("Medium", "High", "Critical")]

    return {
        "module": "Nginx Configuration",
        "severity": "Medium" if related_issues else "Info",
        "issue": (
            "Suggested hardened Nginx configuration generated based on this scan's findings"
            if related_issues else
            "No Nginx-specific issues detected; a baseline hardened config is provided for reference"
        ),
        "recommendation": "Review and adapt the generated server block below for your Nginx setup",
        "data": {"config": generated_config}
    }