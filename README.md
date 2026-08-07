# Style Scout

# TagLoop — Component Breakdown + Lovable Build Prompts

(Rename the product to whatever you've decided. Find-and-replace TagLoop before pasting.)

---

## Part 1 — The build, broken into components

Seven independent pieces. Three can be built in parallel by three people; the funnel is the one that must ship first because it's the one that produces defensible metrics.

| # | Component | What it does | Risk | Owner |

|---|---|---|---|---|

| 1 | *Onboarding funnel* | Phone → OTP → paywall → Razorpay. Logs every step. | Low | C |

| 2 | *Upload + storage* | Photo/reel-frame upload to Supabase Storage | Low | A |

| 3 | *Vision detection* | Edge function → Claude vision → structured JSON of garments | *High — build first* | A |

| 4 | *Affiliate link builder* | JSON → Amazon India search deep-link with real associate tag | Low | B |

| 5 | *Click tracker* | /r/:code redirect that logs a click, then 302s to Amazon | Low | B |

| 6 | *Metrics dashboard* | Only honest numbers: funnel, uploads, items, links, clicks | Low | C |

| 7 | *Consent layer* | Creator opt-in copy + record. Kills the content-rights question. | Trivial | C |

*Two things worth deciding before you paste anything:*

*a) Why would a creator pay for a tool that pays them?* A judge will ask this. Your paywall needs a coherent story or the intent-to-pay number reads as noise. The version that holds up: free tier = 3 scans/month, manual copy-paste. Pro = unlimited scans, auto-generated link-in-bio page, priority processing, click analytics. You're charging for volume and automation, not for the affiliate access itself. Price it low (₹9 trial → ₹149/month) — you're measuring whether they'll enter card details at all, not optimizing ARPU.

*b) OTP is a time trap.* Real SMS OTP needs MSG91/Twilio provisioning and a DLT-registered sender ID in India — that is not a hackathon-hours task. Build the funnel with a dev-mode OTP (accepts 1234, still stores the real phone number), and say so on stage: "OTP is stubbed; the phone capture and the payment are real." Nobody penalises that. Getting caught pretending it's real is what costs you.

---

## Part 2 — Prompt 1: Foundation, design system, onboarding funnel

> Paste this whole block into a fresh Lovable project. Don't add anything to it — let it build, then iterate.

Build a web app called TagLoop. It automatically finds shoppable products in an

influencer's photos and generates affiliate links for them, so micro-influencers

(1K–100K followers in India) can earn from content that has no brand deal attached.

In this first pass, build ONLY: the design system, the landing page, and the

signup funnel. Do not build the product itself yet.

=== DESIGN DIRECTION ===

This is a money tool for young Indian creators. It should feel like a stylist's

callout sheet crossed with a payout statement — precise, a little editorial, not

another purple-gradient SaaS dashboard.

Palette (use exactly these, as CSS variables):

  --ink:      #12161F   (primary text, dark surfaces)

  --paper:    #EEF1F6   (page background — cool gray-blue, NOT cream)

  --card:     #FFFFFF

  --signal:   #E5175B   (primary actions, the brand colour)

  --rupee:    #0F7B4F   (used ONLY for money figures and earnings)

  --muted:    #6B7280

Typography:

  Display/headings: "Archivo" (weight 700–800, tight tracking, -0.03em on large sizes)

  Body/UI: "Inter"

  Numbers, metrics, currency: "JetBrains Mono" — all monetary and metric figures

  render in mono. This is a consistent rule across the whole app.

Signature element: when we later show a detected item on a photo, it renders as a

small tag chip pinned near the item with a hairline leader line pointing at it —

like annotation on a lookbook contact sheet. Design the CSS for this now

(.tag-chip, .leader-line) even though it isn't used yet.

Restraint: no gradients, no glassmorphism, no drop shadows heavier than

0 1px 2px rgba(18,22,31,0.06). Border radius 8px everywhere except the tag chips,

which are pill-shaped. One accent colour doing the work.

=== PAGE 1: LANDING (/) ===

Single screen, mobile-first. Headline that states the mechanic plainly, not a

slogan. Something in the register of: "Your last 40 reels had ₹0 attached to them.

Fix that in one upload." Below: a three-step strip — Upload a photo → We spot what

you're wearing → You get affiliate links to paste. One CTA: "Start free" → /signup.

Small honest line at the bottom: "Free while we're in beta. Works with Amazon

India Associates."

=== PAGE 2: PHONE (/signup) ===

Mirror this exact structure (a reference app the team is using as a pattern):

- Product wordmark centered at top

- A large centered brand graphic/illustration block

- A short value line under it

- "Log in" label

- A single phone input with a fixed "🇮🇳 +91" prefix chip on the left, 10-digit

  numeric only, autofocus, numeric keypad on mobile

- A checkbox, pre-checked, reading: "By signing up you accept the Terms and

  Conditions and Privacy Policy" with both as links

- A full-width primary button "Continue" pinned near the bottom, DISABLED until

  10 digits are entered

On submit: write a row to `funnel_events` with step='phone_entered' and the phone,

then navigate to /verify.

=== PAGE 3: OTP (/verify) ===

- Back chevron top-left, "Verify your number" as the heading

- "OTP sent to +91 XXXXXXXXXX" showing the real number entered

- Four separate single-digit boxes, auto-advance on type, auto-back on delete,

  paste-to-fill supported, numeric keypad

- "Didn't get it? Resend" with a 30-second countdown, and "Change number" below it

- Full-width "Continue" button, disabled until 4 digits entered

DEV MODE: accept any 4 digits. Show a small muted note under the boxes:

"Demo mode — enter any 4 digits." Do not fake sending an SMS.

On success: write funnel_events step='otp_verified', create a row in `creators`

with the phone, store the creator id in local session, go to /upgrade.

=== PAGE 4: PAYWALL (/upgrade) ===

Mirror this structure:

- A muted 20-second product demo video block at the top with play controls

  (use a placeholder <video> with a poster image for now)

- Heading: "Start your trial"

- Price row: "₹149" struck through in --muted, then a large "₹9" in --signal

  using the mono face

- Fine print with an info icon: "₹9 for 7 days, then ₹149/month. Cancel anytime."

- A three-item benefit strip: "Unlimited scans · Auto link-in-bio · Click analytics"

- A trust bar: "Built for Indian creators"

- Payment method row showing the Razorpay logo with a "Change" affordance

- Full-width "Start trial" button at the bottom

Fire funnel_events step='paywall_viewed' on mount. Add a clearly visible

secondary text link: "Skip for now" → goes to /app, and logs

step='paywall_skipped'. We need the skip rate as a metric — do not hide it.

=== DATA MODEL (Supabase) ===

creators(id uuid pk, phone text unique, instagram_handle text, follower_count int,

         consent_given bool default false, created_at timestamptz default now())

funnel_events(id uuid pk, session_id text, phone text, step text, meta jsonb,

              created_at timestamptz default now())

  step ∈ landing_view | phone_entered | otp_verified | paywall_viewed |

         checkout_started | payment_success | payment_failed | paywall_skipped

payments(id uuid pk, creator_id uuid, razorpay_order_id text, razorpay_payment_id

         text, amount_paise int, status text, created_at timestamptz default now())

Enable RLS. Allow anonymous inserts on funnel_events. Creators readable/writable

only by their own session for now — keep it simple, this is a prototype.

Make every page fully responsive and correct on a 390px-wide phone screen first.

---

## Part 3 — Prompt 2: Razorpay

> Run this after Prompt 1 builds cleanly.

Wire up real Razorpay payments on /upgrade.

Add two Supabase edge functions and two secrets (RAZORPAY_KEY_ID,

RAZORPAY_KEY_SECRET). Never expose the key secret to the client.

1) Edge function `create-razorpay-order`:

   - Accepts { creator_id }

   - POSTs to https://api.razorpay.com/v1/orders with HTTP Basic auth

     (key_id:key_secret base64), body: { amount: 900, currency: "INR",

     receipt: <creator_id> }

   - Inserts a `payments` row with status='created' and the returned order id

   - Returns { order_id, amount, key_id } to the client

2) Client: load https://checkout.razorpay.com/v1/checkout.js dynamically.

   On "Start trial": log funnel_events step='checkout_started', call the edge

   function, then open Razorpay checkout with the returned order_id, key_id,

   prefill.contact = the creator's phone, theme.color = "#E5175B",

   name = "TagLoop", description = "7-day trial".

3) Edge function `verify-razorpay-payment`:

   - Accepts { razorpay_order_id, razorpay_payment_id, razorpay_signature }

   - Computes HMAC-SHA256 of `${order_id}|${payment_id}` using the key secret and

     compares it to the signature. Reject on mismatch — do not trust the client.

   - On match: update the payments row to status='paid', store the payment id,

     insert funnel_events step='payment_success'

   - On mismatch or on the checkout modal being dismissed: log

     step='payment_failed' with the reason in meta

4) Success state: a /welcome screen confirming the trial started, then → /app.

Use Razorpay TEST keys for now. Add a small env-driven banner reading "Test mode"

whenever the key id starts with rzp_test_ so we never demo a fake payment while

claiming it's real.

*On test vs live:* test-mode payments prove the flow works but prove nothing about intent — a test card is free. If you want an intent number you can actually defend, switch to live keys and charge a real ₹9. One real ₹9 charge from a stranger is worth more in a pitch than fifty test-mode completions. Razorpay live activation needs KYC though, so only chase this if someone on the team already has an activated account.

---

## Part 4 — Prompt 3: The core product

Now build the actual product at /app.

=== UPLOAD (/app) ===

A single drop-zone card: "Drop a photo from your reel." Accepts JPG/PNG, max 10MB,

also works via camera on mobile. Below it, a required checkbox before the upload

button activates:

  "I own this content and I'm asking TagLoop to scan it."

Store that as creators.consent_given. This is the opt-in — it is not optional and

it must be visible, not buried in terms.

Upload to a Supabase Storage bucket `uploads`. Insert an `uploads` row. Then call

the `detect-items` edge function and show a processing state with a live-ticking

elapsed-milliseconds counter in the mono face (we report real processing time as a

metric, so measure it honestly — start the timer on request, stop it on response).

=== EDGE FUNCTION `detect-items` ===

Secret: ANTHROPIC_API_KEY. Fetch the image from storage, base64 it, and call

https://api.anthropic.com/v1/messages with a current Claude vision model

(confirm the exact model string in the Anthropic console) and this system prompt:

  You are a fashion cataloguer. Look at the image and list every visible clothing

  item, footwear item, bag, and accessory worn by a person. Ignore background

  objects, furniture, and anything not worn.

  Respond with ONLY a JSON object, no markdown fences, no preamble, matching:

  {

    "items": [

      {

        "category": "top|bottom|dress|outerwear|footwear|bag|jewellery|eyewear|watch|headwear|other",

        "name": "short human-readable name, e.g. 'oversized striped shirt'",

        "primary_color": "single colour word",

        "secondary_color": "single colour word or null",

        "pattern": "solid|striped|checked|floral|printed|colourblock|other",

        "material_guess": "cotton|denim|linen|leather|knit|synthetic|unknown",

        "fit_or_style": "e.g. 'oversized', 'slim fit', 'A-line', 'chunky sole'",

        "gender_presentation": "mens|womens|unisex",

        "search_query": "a 5-9 word query you would type into Amazon India to find

                         a close match, no brand names unless a logo is clearly legible",

        "confidence": 0.0-1.0

      }

    ]

  }

  Never invent a brand. If a logo is not legible, omit brand entirely. If you see

  no worn items, return {"items": []}.

Parse defensively: strip any  fences, try/catch the JSON.parse, and on a parse

failure retry once before surfacing an error. Store each item in detected_items

with the upload_id and the measured processing_ms on the parent upload row.

=== RESULTS (/app/results/:uploadId) ===

Show the uploaded photo large. Overlay the detected items as the tag chips designed

earlier — pill chips with hairline leader lines, positioned around the image

perimeter (we don't have bounding boxes, so distribute them evenly rather than

faking precision).

Below the photo, a list of item cards. Each card shows: item name, colour swatch,

confidence as a mono percentage, and a "Copy link" button. Each card also shows an

estimated commission line in --rupee.

Let the creator delete an item the model got wrong, and edit the search query

inline. Log both — correction rate is a real and interesting metric.

Empty state: "No worn items found in this photo. Try one where the outfit is

clearly visible." Not an apology, just the fix.

=== AFFILIATE LINKS ===

For each detected item, build:

  https://www.amazon.in/s?k={url-encoded search_query}&tag={AMAZON_ASSOCIATE_TAG}

Store the target in affiliate_links with a 7-character random short_code.

AMAZON_ASSOCIATE_TAG is a secret — use the team's real associate tag.

Create a commission_rates table (category text, rate_percent numeric,

source_url text, verified_on date) and seed it from Amazon India's published

Associates fee schedule. Verify every rate against the live page before seeding —

do not guess these numbers, they are the one figure a judge can check in ten

seconds. Estimated commission per item = rate × an assumed order value stored in a

single config row, and every place it appears must be labelled "estimated" with

the assumption visible on hover.

=== CLICK TRACKER ===

Route /r/:code → edge function that inserts a clicks row (link_id, referrer,

user_agent, hashed IP, timestamp) and then 302-redirects to the stored Amazon URL.

Redirect first-class: the insert must not block the redirect by more than ~50ms.

The "Copy link" button copies the /r/:code URL, never the raw Amazon one.

---

## Part 5 — Prompt 4: The metrics dashboard

Build /metrics — a public dashboard we show on stage. Every number here must be

real and traceable to a database row. Do not add any projected, simulated, or

placeholder figures anywhere on this page.

Layout: a funnel visualisation on top, metric tiles below, recent activity at the

bottom. All numbers in JetBrains Mono, money in --rupee.

Funnel (counts + conversion % between each step, from funnel_events):

  Landing views → Phone entered → OTP verified → Paywall viewed →

  Checkout started → Payment success

Show the paywall skip count alongside, not hidden.

Tiles:

  Photos processed          (count of uploads)

  Median processing time    (median, not mean — one slow outlier shouldn't flatter

                             or wreck the number; render in ms)

  Items detected            (count of detected_items)

  Items per photo           (mean, 1 decimal)

  Links generated           (count of affiliate_links)

  Real clicks               (count of clicks)

  Creators onboarded        (count of creators)

  Items corrected by users  (count of edits/deletes ÷ items detected, as %)

Below the tiles, one line of plain text, always visible, not a tooltip:

  "We're 6 hours old. These are usage and accuracy numbers from real uploads.

   We have no revenue data — affiliate conversions take days to settle, so any

   revenue figure at this stage would be a guess, and we'd rather show you what

   we can prove."

Recent activity table: last 20 uploads with timestamp, items found, processing ms,

links generated. Poll every 10 seconds so it updates live during the demo.

Add a /metrics/seed-check admin view listing any row that came from the team's own

accounts so we can state the external-vs-internal split honestly if asked.

```

---

## Part 6 — Before you demo

- *Pre-process 8–10 real reels.* Live processing on stage will lag or fail. Have the data already in the database and open the dashboard, not the uploader.

- *Have one person on outreach the entire time.* Five real creators who uploaded beats any amount of extra polish. That's the number judges remember.

- *Get 10–20 real clicks through /r/:code* before judging — post the links in a WhatsApp group. A real click counter that's ticking is disproportionately convincing.

- *Know your three weakest answers cold:* why creators pay for a tool that pays them; why search-links instead of exact SKU match (say it plainly: exact SKU retrieval is a vector-search problem against a real catalogue, it's the v2, and pretending otherwise in 6 hours is how you get caught); and what happens to content rights (answer: creator-initiated upload, explicit consent checkbox, we never scrape).

- *The metrics line on the dashboard is your strongest slide.* Don't cut it for space.

---

## Part 7 — If Lovable fights you

- It sometimes tries to install a phone-auth provider on its own. Tell it explicitly: "Do not configure Supabase phone auth. The OTP is a stub."

- Edge functions calling external APIs occasionally get wrapped in unnecessary client-side proxies. If a secret ever appears in browser network calls, stop and say: "Move this call fully into the edge function; the client must never see the key."

- If the design drifts toward generic SaaS after a few iterations, re-paste the DESIGN DIRECTION block verbatim and say "re-apply these tokens across all existing pages."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tagr-shop-style.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb2815be-7b75-4b55-b6c3-ce460b6d07cc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
