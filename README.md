# Shreshta Designs website

React and Vite generate static HTML for the homepage, studio pages, services and ceremony albums. The existing PHP endpoint handles consultation requests. The deployed website uses the hosting account's PHP runtime.

## Run locally

Use Node.js 22.12+ or a newer supported LTS release and npm.

```sh
npm ci
npm run dev
```

The development site runs at `http://localhost:3000/`. Vite serves the frontend during development. A local PHP runtime with a mail transport is needed to test actual enquiry delivery.

## Produce and verify a release

```sh
npm run lint
npm run build
npm run verify
```

The contents of `dist/` are the production release. The build generates route HTML, `sitemap.xml`, `robots.txt`, a 404 page, `.htaccess` and the PHP handler. No Node server or API key is required on the host.

For a private test domain or subdomain:

```sh
SITE_STAGING=1 npm run build
npm run verify -- dist-staging
```

Upload `dist-staging/` to the test host. It adds `noindex, nofollow`, disallows crawling and omits the sitemap. Use hosting authentication to keep non-public content private.

## Deploy on Hostinger

1. In hPanel, verify that the domain is assigned to a Custom PHP/HTML website, the plan supports PHP and `.htaccess`, and SSL certificates cover the bare domain and the `www` alias. Use a maintained PHP release such as 8.3 or newer and disable display of PHP errors in production.
2. Back up the current web root, including hidden files and verification files, outside `public_html`. Keep a copy of the current hPanel SSL/CDN settings.
3. Upload the **contents** of `dist/` to `public_html`, including `.htaccess`. Use the host's release or file manager workflow to switch to the new files together. When publishing a later release, keep the previous fingerprinted JS and CSS available while visitors may still have the older page open. Keep search verification files already in use.
4. Test the homepage, a direct album URL, `/services/#service-reception`, `/robots.txt`, `/sitemap.xml`, and a missing URL. Scroll in both directions between Celebrations and the temple mandap. Confirm HTTPS and the `www` redirect while preserving the original path and query string. Check the response headers through the CDN before enabling HSTS in hosting settings.
5. Verify that `info@shreshtadesigns.com` accepts mail. Submit one enquiry on the deployed site and confirm it arrives and can be replied to using the submitted address. Clear the CDN cache if older HTML or rules are still served.
6. To roll back, restore the previous web root and its `.htaccess`, clear the CDN cache and repeat page and form checks.

[Hostinger web root](https://www.hostinger.com/support/1583494-what-is-the-path-to-your-website-s-root-home-directory-and-how-to-change-it-in-hostinger/) · [Hostinger .htaccess support](https://www.hostinger.com/support/1583307-how-to-create-an-htaccess-file-at-hostinger/)

### CDN and traffic checks

When Hostinger CDN is active, the production build allows public HTML to be cached at the edge for five minutes. Gallery images use smaller previews and load the full photos when opened. The enquiry response uses `Cache-Control: no-store`, and staging HTML is private and uncached.

After deployment, check `x-hcdn-cache-status` for a repeated homepage and image request. Before expecting a high-traffic event, verify peak requests per second, p95 latency, error rates and origin resource usage on the selected plan. Use an authorized staging test with enquiry delivery intercepted. Local Apache results describe the build on this machine. [Hostinger CDN caching](https://www.hostinger.com/support/how-hostinger-cdn-caching-works/) · [Hostinger plan limits](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)

### Enquiry delivery

The frontend posts JSON to `/api/consultation.php`. The endpoint sends through the host's PHP mail transport to `info@shreshtadesigns.com`, with the visitor's address set as Reply-To. It requires a writable PHP temporary directory for rate limiting. The web server should supply the visitor address in `REMOTE_ADDR`. Check this through the Hostinger CDN before adjusting any proxy settings. The existing WhatsApp contact remains available.

For authenticated Hostinger SMTP, replace the mail transport in `public/api/consultation.php` with PHPMailer using the verified sender mailbox. Keep SMTP credentials in server-side configuration outside the public web root and preserve the visitor address as Reply-To. After setup, send a test through both the Enquire page and an album popup, check receipt at `info@shreshtadesigns.com`, and verify you can reply to the submitted address. Hostinger applies separate limits to its built-in PHP mail transport. [Hostinger PHPMailer guidance](https://www.hostinger.com/tutorials/how-to-send-emails-using-phpmailer/) · [Hostinger PHP mail limits](https://www.hostinger.com/support/11393648-php-mail-limitation-explained-how-to-improve-email-delivery-with-smtp/)

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for verification results, launch checks and the file inventory.
