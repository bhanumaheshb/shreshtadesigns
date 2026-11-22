# Shreshta Designs

Build with Node.js 22.12 or later. The Express server serves the pre-rendered Vite site and accepts enquiries at /api/consultation.

```sh
npm ci
npm run lint
npm run build
npm run verify
npm start
```

## Hostinger Web App

Upload this source project. Select Express, Node.js 22 or 24, npm, the project root, build command npm run build, and entry file server.js. If an output directory is requested, use dist. The server listens on PORT, with 3000 as the default.

For Hostinger Email add SMTP_USER and SMTP_PASSWORD in Hostinger's environment variable settings. SMTP_USER is the sending mailbox address. SMTP_PASSWORD is that mailbox's password. The default SMTP host is smtp.hostinger.com on port 465, and the recipient is info@shreshtadesigns.com. SMTP_HOST and SMTP_PORT override the transport when needed.

If the host supplies client addresses via a trusted reverse proxy, set TRUST_PROXY only to the verified proxy addresses. The enquiry rate limit is per server process.
