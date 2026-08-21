def check_headers(headers):
    security_headers = {
        "X-Frame-Options": "Medium",
        "X-Content-Type-Options": "Low",
        "Content-Security-Policy": "High",
        "Strict-Transport-Security": "High"
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

    return results