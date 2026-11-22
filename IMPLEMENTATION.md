# Shreshta Designs implementation report

## Pre-deployment QA follow-up

- Reproduced the reported Celebrations-to-mandap clipping on a desktop and a short tablet viewport. The revised transition retains the editorial overlap, smooth scrolling and text reveals. The mandap has one sticky image frame with a local paint boundary. Its image and caption stay in the same frame as the preceding section moves behind it.
- At widths of 720px and above, tablets use the desktop navigation, side-by-side process and Services compositions, album grid and editorial overlaps. On phones, the process copy follows its photo without a large gap, the story copy and quote sit side by side beneath the portrait, and the opening wordmark clears the WhatsApp button.
- The Reception service now uses the chandelier-lit ballroom and candlelit head-table images from its album. The five album grids use 40 lighter previews. For the eight grid images per album, the combined transfer was reduced from 12.85 MB to 3.17 MB. Album covers and open lightboxes use the full images.
- Production and staging builds, TypeScript, static route validation, PHP 8.3 validation with simulated mail, and browser regression checks passed locally. The enquiry flow preserves input after delivery errors and rate-limited responses, prevents duplicate submissions in flight, and passed in both the main form and album popup. The PHP test verified the recipient and Reply-To. Inbox delivery remains a Hostinger setup check.
- Local Apache served 10,000 mixed page and album-preview requests at a paced 500 requests per second with zero failures and 1.1 ms p95 response time. An earlier unpaced burst had 42 connection resets across 10,000 attempts. These local figures do not validate production capacity. The deployment guide covers checking CDN cache hits, the chosen plan and peak traffic on authorized staging.

## 1. Architecture and baseline

The site uses React 19, Vite 8, GSAP and Lenis. Before this work, the build served one empty React root and opened separate experiences through hash URLs. A standalone PHP endpoint handled the main enquiry form. The album enquiry popup confirmed requests locally without sending them. The build copied unused 3D media and editor uploads alongside site assets.

The Vite build now renders the existing React components to HTML and hydrates only the route being viewed. Hostinger serves the generated files and runs the existing PHP endpoint. The release has no Node server, database, login, CMS, analytics or payment dependency. The visible design uses the existing typography, photographs, colour palette, layouts and scroll effects. The build precomputes the slider cutouts using the previous processing logic and updates the visible brand spelling to Shreshta Designs.

On 22 November 2026, the public domain returned a Hostinger parking page, including at the expected Services and sitemap URLs. The release was tested locally. The Hostinger account, plan and CDN or firewall rules require account access for verification. [Public domain](https://shreshtadesigns.com/)

## 2. Technical SEO

- Generated 12 public HTML routes for the homepage, services, five studio pages and five albums. Each serves a title, description, H1, canonical, Open Graph metadata, social card and crawlable links before JavaScript runs.
- Kept all five services on one scrolling page. Links target the relevant chapter with anchors such as `/services/#service-haldi`. Legacy `#/` links move visitors to the new route in the browser. The homepage's existing section anchors still work.
- Generated an XML sitemap with 12 canonical HTTPS URLs. The Apache rules handle missing pages, directory URLs, direct `index.html` requests and HTTPS/non-www redirects for the public domain. Query parameters pass through redirects and canonicals use the clean route.
- Generated a separate staging build that disallows crawlers and includes page-level `noindex`. Use host authentication for private staging.
- All public routes were tested against the raw HTML, and representative navigation was tested in Chrome with JavaScript disabled. [Google JavaScript SEO documentation](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

## 3. AI search discovery

The production crawler policy permits public pages for Googlebot, Bingbot, OAI-SearchBot and PerplexityBot through the default robots group. It excludes the submission endpoint and explicitly disallows GPTBot, which has a separate training purpose. Review that training choice with the business if its preference changes. The release exposes service descriptions, the Hyderabad service area, the studio process, sample timelines and direct answers about scope and quote factors. [OpenAI crawler policy](https://developers.openai.com/api/docs/bots) · [Perplexity crawler policy](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) · [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) · [Bing webmaster guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)

## 4. Local SEO and content

A sample of public search results for Hyderabad wedding planning and mandap design showed local service providers, industry directory listings and visual examples. The mapping below reflects those intents and the site's services. Search volume and rankings were not measured.

| Page | Search intent |
| --- | --- |
| `/` | Wedding planners and wedding event management in Hyderabad |
| `/services/` | Hyderabad wedding planning, mandap design, wedding decoration, and ceremony coordination |
| `/experiences/` | Wedding design, florals and lighting, and guest experience |
| `/celebrations/` and `/album/…/` | Engagement, Sangeet, Haldi, Wedding, and Reception design inspiration |
| `/our-approach/` | How wedding planning, design and production work |
| `/our-story/` and `/enquire/` | Brand and studio research, wedding consultations and quotes |

The site now uses Hyderabad as its documented market. Removed unsupported city and artisan-count claims from the affected copy. Service guidance explains quotation factors. Albums are described as design inspiration and example schedules are labelled as such. Confirm imagery rights and the accuracy of any project-specific copy before public use. Verified project details, real wedding galleries and approved pricing would support future case studies.

There is no blog. For occasional articles, use Markdown and the existing build-time renderer. A headless CMS can feed the same build if the studio later needs a publishing interface.

## 5. Structured data

JSON-LD describes the Organization and WebSite, with a Service entity on the services page. The business data uses the supplied name, domain, Hyderabad service area, logo and enquiry address. The business has not provided a verified street address or opening hours. LocalBusiness and review markup were omitted. The local build check parsed the JSON-LD on all 12 routes and verified the expected types and image URLs. See the validation status below for the external tools. [Schema.org Service](https://schema.org/Service) · [Google Organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization) · [Google LocalBusiness guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business)

## 6. Performance

Lighthouse navigation tests ran on both builds in the same local Apache and Chrome setup. These figures are single lab runs and can vary with CPU, fonts and browser conditions. Site-specific field INP is unavailable for the redeveloped site.

| Homepage measure | Mobile before → after | Desktop before → after |
| --- | ---: | ---: |
| Performance score | 79 → 100 | 100 → 100 |
| Accessibility score | 95 → 100 | 95 → 100 |
| SEO score | 100 → 100 | 100 → 100 |
| LCP | 2.21 s → 1.46 s | 0.54 s → 0.44 s |
| CLS | 0.027 → 0.025 | 0.009 → 0.006 |
| Transferred page resources | 6.38 MB → 1.42 MB | 6.38 MB → 1.41 MB |

The production artifact fell from 124.2 MB to 15.5 MB by file size. The homepage's primary JavaScript entry and landing chunk total about 404 KB before compression, compared with the previous 472 KB single bundle. Studio and album routes now load their own code. The full-size opening photograph fell from 1.13 MB to 312 KB with a 97 KB responsive variant. Browser-side canvas work was removed from the showcase and duplicate scroll triggers were consolidated. Images below the fold use lazy loading where practical.

## 7. Security and enquiries

- Removed unused dependencies including Three.js, the Gemini SDK, Express and Motion. The npm advisory scan reported zero known vulnerabilities in the remaining lockfile. The production output excludes source maps, repository files, credentials and 3D assets. No private credential requiring rotation was identified in the audited project.
- Added Content-Security-Policy, frame denial, MIME sniffing protection, referrer policy, private-file protection, gzip and caching. The current animation code needs inline styles, which the policy allows. Scripts load from the site, and the policy allows Google Fonts CSS and fonts.
- The main and album enquiry forms use the same PHP endpoint and only show success after it accepts the submission. The endpoint validates size, types, required fields and selected ceremonies. It uses a fixed recipient, validates Reply-To, rejects browser requests marked as cross-site or same-site, and has a honeypot and locked temporary-file rate limit. The form explains how its details are used. The static no-JavaScript page shows direct contact options.
- PHP transport success and failure were tested with simulated mail. Live inbox delivery, the PHP temporary directory and client-IP handling behind Hostinger's CDN need checking on the deployed configuration. HSTS should only follow live HTTPS and domain coverage verification. [OWASP input validation guidance](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) · [OWASP CSP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

## 8. Changed files

| Path | Change |
| --- | --- |
| `.gitignore` | Ignore staging output and temporary renderer builds. |
| `README.md`, `IMPLEMENTATION.md` | Build, deployment, rollback and verification documentation. |
| `index.html` | Per-route head placeholder and trim unused font requests. |
| `package.json`, `package-lock.json` | Remove unused packages and run the static generator and release checks. |
| `tsconfig.json`, `vite.config.ts` | Support build-time rendering and limit the deployment file set. |
| `scripts/build.mjs`, `scripts/verify-build.mjs` | Build production or staging HTML and verify the outputs. |
| `src/main.tsx`, `src/renderPage.tsx`, `src/prerender.tsx` | React hydration, route rendering, metadata, schema and crawler files. |
| `src/data/pages.ts`, `src/data/siteNavigation.ts` | Canonical routes, metadata and legacy URL mapping. |
| `src/data/ceremonies.ts`, `src/data/studioContent.ts` | Compressed imagery, showcase dimensions and Hyderabad consultation copy. |
| `src/App.tsx`, `src/index.css` | Landing showcase, static image loading, skip link and 404 styles. |
| `src/components/AlbumRoute.tsx`, `src/components/CeremonyAlbumPage.tsx` | Standalone album routes and enquiry integration. |
| `src/components/CeremonyPage.css`, `src/components/ServicesPage.tsx` | Service links, chapter anchors, consultation modal and planning answers. |
| `src/components/ConsultationForm.tsx`, `src/components/ConsultationForm.css`, `src/components/ServiceOverlays.tsx` | Shared form, delivery feedback, accessible modal and no-script fallback. |
| `src/components/ShreshtaLandingPage.tsx`, `src/components/ShreshtaLanding.css` | Branding, accessible heading order, responsive hero, static fallback and lighter scroll animations. |
| `src/components/SiteNavigation.tsx`, `src/components/SiteNavigation.css` | Crawlable links, keyboard handling and CSS-only fallback navigation. |
| `src/components/StudioPage.tsx`, `src/components/WhatsAppLink.tsx` | Direct page links and consistent location, enquiry and brand copy. |
| `public/.htaccess`, `public/api/consultation.php` | Server rules, validation and rate limiting. |
| `public/assets/aistudio/shreshta-logo.webp` | Existing logo preprocessed for transparency and WebP. |

The following WebP files in `src/assets/images/` replace their corresponding JPGs, except the new 720-pixel opening variant.

- `album_engagement_detail_1795088227111.webp`
- `album_engagement_hero_1795088227985.webp`
- `album_engagement_hero_720.webp`
- `album_haldi_detail_1795088227294.webp`
- `album_haldi_hero_1795088227114.webp`
- `album_reception_detail_1795088227503.webp`
- `album_reception_hero_1795088227338.webp`
- `album_sangeet_detail_1795088227358.webp`
- `album_sangeet_hero_1795088227933.webp`
- `album_wedding_detail_1795088227965.webp`
- `album_wedding_hero_1795088227497.webp`
- `temple_wedding_mandap_1795089784740.webp`

New files in `src/assets/images/showcase/` contain preprocessed versions of the current centrepieces and motifs.

- `engagement_centerpiece.webp`, `sangeet_centerpiece.webp`, `haldi_centerpiece.webp`, `wedding_centerpiece.webp`, `reception_centerpiece.webp`
- `motif_coupe.webp`, `motif_ghungroo.webp`, `motif_jasmine.webp`, `motif_marigold.webp`, `motif_rings.webp`, `motif_rose.webp`, `motif_tabla.webp`

Removed the 149 files under `public/assets/3d/`, the three modules under `src/three/`, `src/components/HilltopMandap3DSection.tsx`, its CSS file and the 3D scene’s background `src/assets/images/serene_alpine_blue_vista_1795184161281.jpg`. Retired the obsolete Gemini environment template and Bun lockfile. The pre-edit files are in `/private/tmp/sda-optimization-original-source` for local recovery.

## 9. Hostinger deployment

The production deliverable is `dist/`. The build and exact upload, SSL, enquiry smoke test and rollback steps are in [README.md](README.md). The public domain still shows a parking page. The account owner must confirm the site assignment and plan runtime before publishing. The reviewed deployment path uses a Hostinger PHP/HTML site with `.htaccess`. [Hostinger website setup](https://www.hostinger.com/support/1583214-how-to-add-a-website-in-hostinger/) · [Hostinger .htaccess support](https://www.hostinger.com/support/1583307-how-to-create-an-htaccess-file-at-hostinger/)

## 10. External actions and monitoring

- Verify domain ownership in Google Search Console and Bing Webmaster Tools using the owner's verification details. Submit the production sitemap and inspect representative public URLs. Review index coverage, mobile issues and field Core Web Vitals as traffic arrives. [Google Search Console workflow](https://developers.google.com/search/docs/monitor-debug/search-console-start) · [Bing Webmaster Tools](https://www.bing.com/webmasters/help/webmaster-support-24ab5ebf)
- Verify the business profile, name, actual Hyderabad service area, appropriate category, site and contact details. Use real project photos and genuine client reviews. Consider a relevant listing on WedMeGood or WeddingWire India and editorial outreach with a documented project. [Google Business Profile guidelines](https://support.google.com/business/answer/3038177)
- Review CDN crawler logs and challenges after release. If a search crawler needs an exception, verify the crawler and its published IP ranges before changing the rule. Deployment, DNS, hosting security rules, directory listings and outreach were not changed.
- Review data-handling and retention practices before publishing. Add GA4 only with authorization and a real measurement ID. If configured, measure confirmed enquiry success without collecting form fields in analytics.
- Run a monthly search sample on ChatGPT Search, Perplexity, Google AI features and Bing or Copilot where offered. Start with “Shreshta Designs Hyderabad wedding planning,” “Who plans weddings in Hyderabad with mandap design?”, “What does wedding event management in Hyderabad include?” and “What affects the cost of wedding decorations in Hyderabad?” Record date, platform, query, brand mention, official citation, linked page, description accuracy and follow-up improvements. The deployment is still pending, so platform-specific appearance and citations were not measured.

## 11. Verification

| Check | Result |
| --- | --- |
| Production and staging builds, TypeScript check | Passed |
| Rendered routes, metadata, links, referenced assets, crawler rules and schema structure | Passed for all 12 routes in both build modes |
| Local Apache direct routes, missing-page status, redirects, private paths, caching, compression and headers | Passed |
| Mobile menu, Escape handling, service chapter routing, album lightbox, consultation modal and responsive wordmark | Passed in Chrome |
| Desktop scroll-driven showcase and reduced-motion route navigation | Passed in Chrome |
| Browser Back restores the relevant service chapter | Passed at mobile and desktop sizes in Chrome |
| JavaScript-disabled mobile navigation and enquiry contact fallback | Passed in Chrome |
| PHP validation, abuse controls and recipient/Reply-To | Passed in PHP 8.3 with a simulated mail transport |
| Dependency advisories | npm audit reported zero vulnerabilities |
| Lighthouse mobile and desktop | Measured locally. Latest scores are in section 6 |
| External structured-data validators | Local JSON-LD validation passed. The code-snippet tools did not return usable results. Repeat URL validation after deployment |
| Real mail, production SSL/CDN behavior, verified search indexing and field INP | Await live release and access |

## 12. Release status

The generated release builds and passes local browser, static, HTTP and PHP checks. Production verification still requires an account with access to Hostinger, an active enquiry mailbox and an approved deployment. Publish only after checking the service and album routes, security policy, redirects and mail on the actual host. The implementation improves discovery but gives no guarantee of rankings, indexing or AI citations.
