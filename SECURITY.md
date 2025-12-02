# Security Policy

## Supported Versions

We currently support the latest stable release of FlowDocs.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of FlowDocs seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Do not report security vulnerabilities through public GitHub issues.**

### How to Report

Please send an email to **security@flowdocs.dev** with the subject line `[Vulnerability Report]`.

In your report, please include:

1.  **Type of Vulnerability**: (e.g., XSS, SQL Injection, RCE, etc.)
2.  **Full Description**: Detailed description of the vulnerability.
3.  **Reproduction Steps**: Step-by-step instructions to reproduce the issue.
4.  **Proof of Concept**: Code or screenshots demonstrating the vulnerability.
5.  **Impact**: What can an attacker achieve with this vulnerability?

### Response Timeline

*   **Acknowledgement**: We will acknowledge receipt of your report within 48 hours.
*   **Assessment**: We will assess the vulnerability and determine its severity within 5 business days.
*   **Resolution**: We aim to resolve critical vulnerabilities within 14 days.

## Security Best Practices

### For Administrators

*   **Environment Variables**: Ensure `OPENROUTER_API_KEY`, `DATABASE_URL`, and other sensitive keys are kept secret and never committed to version control.
*   **Access Control**: Regularly review user roles and permissions within your workspace.
*   **Updates**: Keep your FlowDocs installation updated to the latest version to ensure you have the latest security patches.

### For Users

*   **Passwords**: Use strong, unique passwords for your account.
*   **API Keys**: If you generate API keys for integrations, treat them like passwords.
*   **Phishing**: Be cautious of suspicious links or messages, even within the platform.

## Out of Scope

The following are generally considered out of scope for our bug bounty program (if applicable):

*   Social engineering attacks.
*   Denial of Service (DoS) attacks.
*   Issues related to third-party services (e.g., OpenRouter, AWS) unless caused by our implementation.
