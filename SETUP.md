# WGMA 2026 Tickets

Two tickets: General Admission $3,000 JMD and VIP $6,000 JMD. Buyers pay by
card through HandyPay, or reserve and send the money on Lynk. Either way the
ticket emails itself, as your artwork with the buyer's QR code on the stub.

---

## How the two payment paths differ

**Card (HandyPay)** is automatic. Buyer pays, HandyPay tells your site, the
ticket sends. You do nothing.

**Lynk** needs one action from you. Lynk has no drop in website integration.
You have to register as a business with Lynk and request API access, and even
then it needs custom development. So this build does it the way that works
today:

1. Buyer picks Lynk, gets a reference like `WGMA-4F2A9C`
2. They send the money on Lynk with that reference in the note
3. You open `/admin.html` and hit **Payment received**
4. Their ticket sends itself

Every Lynk booking also emails you the moment it is placed, so your inbox is a
running record even if the site is having a bad day.

If Lynk approves API access later, that becomes automatic too. It is one
function to swap, same as HandyPay.

---

## Setup

1. Install Node.js from nodejs.org (version 18 or newer)
2. In this folder run `npm install`
3. Copy `.env.example` to `.env` and fill it in
4. Run `npm start`, open http://localhost:3000

On boot the server prints anything missing from `.env` and tells you whether
Gmail accepted your credentials. Read that first line of output before you
assume something else is wrong.

### Getting the pieces

**HandyPay** — sign up in their app, get approved, then find your API key in
the merchant dashboard. Fees are 4.9% + US$0.40 on their free plan. Payouts go
to a Jamaican bank, usually 2 to 4 business days.

**Lynk** — you need a Lynk business account. Put whatever buyers should send
to (handle or number) in `LYNK_HANDLE`, and the same thing in the
`LYNK_HANDLE` line near the bottom of `public/lynk.html`. Those two must match.

**Gmail app password** — your normal password will not work.
myaccount.google.com > Security > turn on 2 step verification > App passwords >
generate one for Mail. Paste that 16 character code into `EMAIL_PASSWORD`.

**Admin key** — make it long and random. Anyone with it can issue free tickets.
Ten wrong guesses from one address locks that address out for five minutes.

---

## What the buyer gets

The ticket email carries their artwork, General or VIP, with a stub drawn
underneath holding their QR code, their name, their reference, and how many
the ticket admits. It goes out as a JPEG of about 500 KB, which opens fine on
mobile data. The plain QR code is attached separately as well, so if a mail
app renders the big image badly they still have a clean code to show.

The QR encodes the reference and nothing else. Reading it tells your door
staff nothing until they check it against the admin page, which is the point.

---

## Deploying on Render

1. Push this folder to a GitHub repo (`.gitignore` already keeps `.env` out)
2. render.com > New > Web Service > connect the repo
3. Build command `npm install`, start command `npm start`
4. Paste every line from your `.env` into Environment
5. Deploy, then put the URL Render gives you into `DOMAIN` and redeploy

There is a `render.yaml` in this folder if you would rather use a blueprint.
It also attaches a small persistent disk, which matters:

**One thing to know about free hosting.** Render's free tier wipes the disk on
restart, which takes `orders.json` with it. Paid orders are safe because
HandyPay has its own record and the buyer has their emailed ticket. Pending
Lynk bookings would vanish from the admin page, but you have every one of them
in your inbox, so you can still confirm the person by replying. The paid plan
plus the disk in `render.yaml` removes the problem entirely.

Health check lives at `/healthz` if your host wants one.

---

## Two things to finish before you go live

**1. The HandyPay call.** It is written against the shape their API takes
(POST a checkout session, get a URL back, receive a webhook). I could not see
their private docs, so check the endpoint path and field names against the
documentation HandyPay gives you and adjust the two lines marked
`<-- confirm` in section 4 of `server.js`. If a test payment opens a real
HandyPay checkout page, you got it right.

**2. Your domain in the share tags.** `public/index.html` has
`REPLACE-WITH-YOUR-DOMAIN` in five places near the top. Swap in your real
address so the link shows the gold preview card when someone drops it in a
WhatsApp group. Until you do, the text preview works but the image will not
load.

---

## Changing things later

**In `.env`** — change, redeploy, about 30 seconds:

- Payment account: `HANDYPAY_API_KEY`, `HANDYPAY_WEBHOOK_SECRET`
- Lynk destination: `LYNK_HANDLE` (and the matching line in `public/lynk.html`)
- Sending email: `EMAIL_USER`, `EMAIL_PASSWORD`
- Admin password: `ADMIN_KEY`

**Ticket prices** live in two files and they must match:

- `server.js` — `TIERS` near the top
- `public/index.html` — `TIERS` in the script at the bottom

Both hold the same shape, so a price change is two edits of the same number:

```js
ga:  { id: 'ga',  name: 'General Admission', price: { JMD: 3000, USD: 20 }, ... }
vip: { id: 'vip', name: 'VIP Admission',     price: { JMD: 6000, USD: 40 }, ... }
```

The USD figures are set at roughly 150 to 1. Move them whenever the rate does.
And remember the price is drawn into the ticket artwork, so a price change
means new artwork too.

**Adding a third tier later** — a table of eight, say — is a real change, not a
config edit. Ask and I'll do it.

**Swapping the logo** — drop a new file over `public/img/wga-logo.png`. The
icons and the share card were cut from that same artwork, so if the logo
changes those want regenerating too. Ask and I'll redo them.

**Swapping the ticket artwork** — drop new files over
`public/img/ticket-ga.jpg` and `public/img/ticket-vip.jpg`. Anything wide and
banner shaped works. The stub with the QR code is drawn underneath at run time,
so you do not need to leave space for it.

---

## Your pages

| Page | What it's for |
|---|---|
| `/` | The event and ticket sales |
| `/admin.html` | Confirm Lynk payments, see takings, check tickets at the door |
| `/lynk.html` | Payment instructions, buyers land here automatically |
| `/success.html` | After a card payment |
| `/404.html` | Anything else |

Those same two ticket images appear on the sales page, so a buyer sees what
they are getting before they pay.

The **Door** tab on the admin page takes a reference and tells your gate staff
admit or do not admit, and flags anything already scanned. Works on a phone.
Staff type the reference off the buyer's QR code. If you want the phone camera
to read the code instead of someone typing it, say the word.

---

## What is in the folder

```
package.json      dependencies and the start script
server.js         the whole backend
ticket.js         draws the digital ticket: artwork plus QR stub
.env.example      copy to .env and fill in
.gitignore        keeps .env and orders.json out of git
render.yaml       optional one click deploy blueprint
SETUP.md          this file
public/
  index.html      event page and checkout
  lynk.html       Lynk payment instructions
  success.html    after a card payment
  admin.html      your orders and door check
  404.html        wrong turn
  robots.txt      keeps admin out of Google
  favicon.ico
  img/            logo, icons, share card, both ticket artworks
orders.json       created on the first booking, not in git
```

---

## Before you sell a real ticket

- Buy one yourself with a real card and confirm the email arrives
- Buy one of each, General and VIP, so you see both artworks come through
- Do a Lynk booking start to finish, including confirming it on the admin page
- Open the ticket email on a phone, not just a laptop
- Scan the QR on the ticket image off a phone screen, the way the door will
- Check it did not land in spam
- Paste your link into a WhatsApp chat with yourself and see the preview card
- Decide who is on the door and make sure they can open `/admin.html`
- Send a friend the link and watch them use it without helping
