# Security Best Practices for Stream

- All media and control traffic is end-to-end encrypted (WebRTC DTLS-SRTP).
- Use strong authentication for all users and devices.
- Never expose signaling or backend APIs without authentication.
- Regularly update dependencies and monitor for vulnerabilities.
- Use secure build and deployment pipelines.
- For SaaS: isolate tenants, use least-privilege access, and monitor for abuse.
- For on-prem: restrict network access, use firewalls, and audit logs.
