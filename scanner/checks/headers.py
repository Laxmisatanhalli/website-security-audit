def check_headers(headers):
    security_headers = {
        "Content-Security-Policy": "High",
        "Strict-Transport-Security": "High",
        "X-Frame-Options": "Medium",
        "X-Content-Type-Options": "Low",
        "Referrer-Policy": "Low",
        "Permissions-Policy": "Low",
        "Cross-Origin-Opener-Policy": "Low",
        "Cross-Origin-Embedder-Policy": "Info",
        "Cross-Origin-Resource-Policy": "Info",
        "X-Permitted-Cross-Domain-Policies": "Info",
    }

    informational_headers = {
        "Cache-Control": "Controls whether pages may be stored/cached; important on pages with sensitive data",
        "Pragma": "Older HTTP/1.0 caching directive, sometimes used alongside Cache-Control",
        "Expires": "Sets a fixed expiry date for caching, superseded by Cache-Control in most setups",
        "Clear-Site-Data": "Tells the browser to clear cookies/storage, typically only sent on logout",
        "Expect-CT": "Certificate Transparency enforcement; deprecated and ignored by current browsers",
    }

    results = []

    for header, severity in security_headers.items():
        if header not in headers:
            results.append({
                "module": "HTTP Security Headers",
                "severity": severity,
                "issue": f"{header} header is missing",
                "recommendation": f"Add the {header} security header"
            })

    for header, note in informational_headers.items():
        if header not in headers:
            results.append({
                "module": "HTTP Security Headers",
                "severity": "Info",
                "issue": f"{header} header is not set",
                "recommendation": f"Optional: {note}"
            })

    return results