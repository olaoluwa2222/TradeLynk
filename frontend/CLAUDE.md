# CLAUDE.md — Tradelynk Developer Instructions
> Place this file in the ROOT of your project. Claude will read it automatically.
> Last updated: March 2026

---

## 🧠 WHO YOU ARE

You are a senior full-stack engineer and product designer working on **Tradelynk** — a Nigerian social commerce platform for Instagram sellers. You have deep experience with Next.js, React, Tailwind CSS, and product UX.

You do NOT produce placeholder code, lorem ipsum, or "TODO: implement this later" stubs unless explicitly asked. Every piece of code you write must be production-ready, follow the existing design system, and solve the actual problem — not a simplified version of it.

---

## 🏗️ WHAT TRADELYNK IS

Tradelynk has TWO core products:

### 1. Storefront / Mini Website
- Sellers get a subdomain: `storename.tradelynk.app`
- They can upload products, organize into collections, show images/prices/descriptions
- Buyers can browse and place orders
- **This is fully built and working. Do NOT redesign it from scratch.**

### 2. WhatsApp AI Sales Assistant *(Coming Soon / Pro)*
- Connects to seller's WhatsApp number
- AI replies automatically to customer messages
- Sends product details, images, prices
- Generates checkout/payment links
- Handles multiple customers simultaneously, 24/7
- **Currently blocked pending Meta business verification. Treat as "Pro - Coming Soon" in all UI.**

---

## 👥 USER TYPES

There are exactly TWO user roles:

| Role | What they do | Where they go after login |
|---|---|---|
| `seller` | Creates a store, lists products, manages orders | `/dashboard/seller` |
| `buyer` | Browses products, places orders | `/items` |

**CRITICAL RULE:** After any login or signup, ALWAYS check `user.role` and redirect accordingly. Sellers NEVER land on `/items`. Buyers NEVER land on `/dashboard/seller`. This is not optional.

---

## 🗺️ CORRECT USER FLOWS

### New User Signup Flow
```
/signup
  → Collect: name, email, password
  → Ask: "I want to..." 
      [Sell on Tradelynk] → role = 'seller'
      [Shop on Tradelynk] → role = 'buyer'
  → Create account
  → IF seller → redirect to /dashboard/seller (show onboarding checklist)
  → IF buyer  → redirect to /items
```

### Returning User Login Flow
```
/login
  → Authenticate
  → Check user.role
  → IF seller → /dashboard/seller
  → IF buyer  → /items
```

### Seller Onboarding Checklist (on dashboard)
Show this until all steps are complete. Collapse/dismiss after completion.
1. ✅ Account created
2. ✅ Email verified  
3. ⬜ Set up store name & customize your link
4. ⬜ Add your first product
5. ⬜ Share your store link
6. ⬜ Connect WhatsApp AI *(Pro — Coming Soon)*

---

## 🎨 DESIGN SYSTEM — FOLLOW THIS EXACTLY

### Color Palette
```css
/* Primary */
--color-primary: #7C3AED;        /* Purple - main brand color */
--color-primary-dark: #5B21B6;   /* Darker purple for hover */
--color-primary-light: #EDE9FE;  /* Light purple for backgrounds */

/* Accent */
--color-accent: #F59E0B;         /* Amber - for highlights, stats */
--color-accent-green: #10B981;   /* Green - for success, checkmarks */
--color-accent-red: #EF4444;     /* Red - for errors, warnings */

/* Neutrals */
--color-dark: #0F0F0F;           /* Near-black - dark sections bg */
--color-dark-card: #1A1A1A;      /* Dark card backgrounds */
--color-dark-border: #2A2A2A;    /* Dark section borders */
--color-text-primary: #111827;   /* Main body text (light bg) */
--color-text-secondary: #6B7280; /* Muted text */
--color-text-white: #F9FAFB;     /* Text on dark backgrounds */
--color-bg-light: #F9FAFB;       /* Light page background */
--color-bg-white: #FFFFFF;       /* White cards */
```

### Typography
```
Font: Inter (already imported via Google Fonts or next/font)

Hero Headline:    font-size: 56-72px, font-weight: 800, line-height: 1.1
Section Headline: font-size: 36-48px, font-weight: 700
Card Title:       font-size: 20px,    font-weight: 600
Body:             font-size: 16px,    font-weight: 400, line-height: 1.6
Small/Caption:    font-size: 14px,    font-weight: 400, color: muted
```

### Spacing Rules
- Section padding: `py-20 md:py-28` (Tailwind)
- Card padding: `p-6 md:p-8`
- Gap between feature cards: `gap-6`
- Max content width: `max-w-6xl mx-auto px-4`

### Component Patterns
```jsx
// PRIMARY BUTTON
<button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold 
  px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-200">
  Button Text
</button>

// SECONDARY BUTTON  
<button className="border-2 border-gray-200 hover:border-purple-600 text-gray-700 
  hover:text-purple-600 font-semibold px-6 py-3 rounded-xl transition-all duration-200">
  Button Text
</button>

// FEATURE CARD (dark background sections)
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 
  hover:border-purple-600/40 transition-all duration-200">
  ...
</div>

// FEATURE CARD (light background sections)
<div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm 
  hover:shadow-md transition-all duration-200">
  ...
</div>

// STAT BADGE
<div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 
  font-semibold text-sm px-3 py-1 rounded-full">
  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
  Badge Text
</div>

// SECTION LABEL (small text above headlines)
<p className="text-purple-600 font-semibold text-sm tracking-widest uppercase mb-3">
  Section Label
</p>
```

### Dark vs Light Sections
The homepage alternates between dark and light:
```
Header:          Dark background (#0F0F0F), white text
Hero:            Dark background (#0F0F0F), white text  
Pain Section:    White background, dark text
Solution:        Dark background (#0F0F0F), white text
Features:        White background, dark text
How It Works:    Light gray background (#F9FAFB), dark text
Social Proof:    White background, dark text
Pricing:         Dark background (#0F0F0F), white text
FAQ:             White background, dark text
Final CTA:       Purple gradient, white text
Footer:          Dark background (#0F0F0F), white text
```

---

## 📄 HOMEPAGE STRUCTURE — BUILD THIS EXACTLY

The homepage at `/` (or the landing page) must contain ALL of these sections in this order:

### Section 1: Header/Nav
- Logo: "Tradelynk" (bold, white text on dark bg)
- Nav links: Features | How It Works | Pricing | FAQ
- Right side: `Login` (text link) + `Get Started Free` (primary button)
- Sticky on scroll with backdrop blur

### Section 2: Hero
- Small badge: "Built for Instagram Sellers 🇳🇬"
- Main headline (pick one, don't change without asking):
  **"Stop Losing Sales to Slow Replies"**
- Subheadline: "Tradelynk gives you a professional storefront and an AI Sales Assistant that works 24/7 on WhatsApp — so you never miss a customer again."
- Two CTAs: `Start Selling Smarter →` (primary) + `See How It Works` (secondary)
- Trust line: ✓ Free to start  ✓ Setup in 5 mins  ✓ No tech skills needed
- Visual: Phone mockup showing storefront + WhatsApp chat

### Section 3: Pain Section
- Label: "SOUND FAMILIAR?"
- Headline: "Selling on Instagram is exhausting"
- Subtext: "You spend hours every day answering the same questions, losing sales while you sleep, and watching customers leave because you replied too late."
- Three pain cards:
  1. 💬 "Price?" "Available?" "More pics?" — *73% of seller time wasted on repetitive DMs*
  2. ⏰ Customers don't wait — *60% of sales lost due to late replies*
  3. 😴 You can't be online 24/7 — *₦210K+ average monthly revenue missed from off-hours*

### Section 4: Solution — TWO FEATURES (THIS IS THE MOST IMPORTANT MISSING SECTION)
- Label: "THE SOLUTION"
- Headline: "Two powerful tools. One simple platform."
- Show BOTH features side by side:

**Feature Card 1: Your Storefront**
- Icon: 🏪
- Title: "Your Professional Storefront"
- Description: "Get your own store link like `yourstore.tradelynk.app`. Upload products, organize collections, and share one link instead of sending photos one by one."
- Bullets: ✓ Launch in 5 minutes  ✓ Share on Instagram bio  ✓ Customers can order directly
- Badge: "Available Now — Free"

**Feature Card 2: WhatsApp AI Assistant**
- Icon: 🤖
- Title: "Your 24/7 WhatsApp AI"  
- Description: "AI that replies to customers, sends product details, and generates payment links — even while you sleep."
- Bullets: ✓ Auto-replies instantly  ✓ Handles unlimited chats  ✓ Works at 3AM
- Badge: "Pro Plan — Coming Soon"

### Section 5: How It Works
- Label: "HOW IT WORKS"
- Headline: "Up and running in 3 steps"
- Steps:
  1. **Create your free store** — Sign up, pick your store name, get your link instantly
  2. **Add your products** — Upload photos, set prices, organize into collections
  3. **Share & sell** — Drop your link in your Instagram bio and start receiving orders

### Section 6: Social Proof
- Headline: "Trusted by Instagram sellers across Nigeria"
- 3 testimonial cards (use realistic placeholder names/businesses if real ones not available)
- Trust stats: "500+ sellers" | "₦50M+ in orders" | "4.9★ rating"

### Section 7: Pricing
- Label: "PRICING"
- Headline: "Simple, transparent pricing"
- Two tiers:

| FREE | PRO |
|---|---|
| Storefront link | Everything in Free |
| Upload unlimited products | WhatsApp AI Sales Assistant |
| Receive orders | Auto-replies 24/7 |
| Share your link | Generate payment links |
| | Handle unlimited chats |
| ₦0/month | ₦7,500/month |
| [Get Started Free] | [Join Waitlist] |

### Section 8: FAQ
Standard accordion. Questions:
1. Is Tradelynk only for Instagram sellers?
2. How long does setup take?
3. Do I need tech skills?
4. When will the WhatsApp AI be available?
5. Is my data safe?
6. Can I use Tradelynk alongside my existing Instagram?

### Section 9: Final CTA
- Headline: "Ready to stop losing sales?"
- Subtext: "Join hundreds of Nigerian sellers already using Tradelynk. Free to start, no credit card required."
- Button: "Start Selling Smarter Today →"

### Section 10: Footer
- Logo + tagline
- Links: Features | Pricing | FAQ | Contact | Privacy | Terms
- Social icons
- "© 2026 Tradelynk. Built for Nigerian sellers."

---

## 🖥️ DASHBOARD — SELLER (`/dashboard/seller`)

### Layout
- Left sidebar (fixed, 240px wide)
- Main content area (fluid)
- Top bar with "Add Product" and "View Store" buttons

### Sidebar Items
```
MAIN
  📊 Dashboard (Overview)
  📦 Orders
  🛍️ Products  
  📁 Collections

STORE
  🌐 View My Store
  ➕ Add Product
  ⚙️ Store Settings

COMING SOON
  🤖 WhatsApp AI (badge: "Pro")

[User avatar + name + email]
[Logout]
```

### Dashboard Overview Page Content (in order)
1. **Welcome banner** — "Welcome back, [Name]! 👋 Here's how your store is doing."
2. **Onboarding checklist** — Show only if incomplete. Collapse/dismiss when done.
3. **Store link CTA** — Big card: "Your store link: `name.tradelynk.app`" + [Copy Link] + [Share on WhatsApp] + [Open Store]
4. **Stats row** — Revenue | Sales (orders) | Active Products | Conversion Rate
5. **Revenue Over Time chart**
6. **Recent Orders table**
7. **Item Status breakdown** (Active / Sold / Draft)

### Stats Card Design
```jsx
// Each stat card:
<div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-2">
    <p className="text-gray-500 text-sm font-medium">Revenue</p>
    <span className="text-2xl">💰</span>
  </div>
  <p className="text-3xl font-bold text-gray-900">₦287,100</p>
  <p className="text-green-600 text-sm mt-1">↑ 12% this week</p>
</div>
```

---

## ⚠️ RULES — NEVER BREAK THESE

1. **NEVER redirect a seller to `/items` after login.** Always `/dashboard/seller`.
2. **NEVER show the WhatsApp AI as "available now."** It is always "Coming Soon" or "Pro Plan" until explicitly told otherwise.
3. **NEVER use blue as a primary color.** Purple (`#7C3AED`) is the brand color.
4. **NEVER create a new component if one already exists** that does the same thing. Ask first.
5. **NEVER write placeholder/lorem ipsum copy** in components. Use the actual copy from this document.
6. **NEVER make a full-page redesign** unless explicitly asked. Make surgical changes to what's broken.
7. **ALWAYS ask** before changing routing logic, database schema, or authentication flow.
8. **ALWAYS keep the homepage sections in the exact order** listed above.
9. **When adding a new page**, check the existing layout components and reuse them. Don't create new wrappers.
10. **Mobile-first always.** Every component must look good on a 375px screen before you worry about desktop.

---

## 🛠️ TECH STACK (What's already in this project)

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript / JavaScript
- **Auth:** (check existing auth implementation — do NOT replace it)
- **Database:** (check existing — do NOT change schema without asking)
- **Icons:** Use existing icon library (check imports in existing components)
- **Fonts:** Inter

---

## 📋 WHEN I ASK YOU TO FIX SOMETHING

Follow this process every time:

1. **Read the relevant existing file first** before writing any code
2. **Identify the minimum change** needed to fix the problem
3. **Show me what you're changing and why** before making the change
4. **Make the change surgically** — don't rewrite the whole file
5. **Tell me what to test** after the change

---

## 🚀 CURRENT PRIORITY TASKS

Work on these in order. Do not skip ahead.

### TASK 1 — Fix Login Redirect (URGENT)
**Problem:** After login, ALL users land on `/items` regardless of role.
**Fix:** After successful authentication, check `user.role`. If `seller` → redirect to `/dashboard/seller`. If `buyer` → redirect to `/items`.
**Files to check:** The auth callback, login handler, or middleware file.

### TASK 2 — Fix Signup Flow (URGENT)  
**Problem:** No role selection during signup.
**Fix:** Add a step after collecting email/password: "I want to..." with two options (Sell / Shop). Store the role in the user record.

### TASK 3 — Add Two-Feature Section to Homepage
**Problem:** Homepage only shows the AI feature. The storefront feature is not shown.
**Fix:** Add Section 4 from the homepage structure above (between the Pain section and How It Works). Show both the Storefront and AI as separate feature cards.

### TASK 4 — Update Pricing Section
**Problem:** No pricing section exists on the homepage, or it doesn't distinguish Free vs Pro.
**Fix:** Add the pricing section with Free (storefront only) and Pro (+ WhatsApp AI - Coming Soon).

### TASK 5 — Dashboard Store Link CTA
**Problem:** The dashboard doesn't prominently show the seller's store link.
**Fix:** Add a prominent card near the top of the dashboard overview with the store link, copy button, and share options.

### TASK 6 — Dashboard Visual Polish
**Problem:** Stats cards and layout look plain.
**Fix:** Apply the stat card design pattern from this document. Add proper icons, spacing, and color to the stat cards.

---

## 💬 HOW TO COMMUNICATE WITH ME

- If something is **unclear**, ask ONE specific question before proceeding
- If a task will **affect multiple files**, list them all and confirm before starting
- If you see a **bug while working on something else**, flag it but don't fix it unless asked
- Use **short, direct language** — no lengthy explanations unless I ask
- When you finish a task, tell me: what you changed, what file, and what to test

---

*This file is the source of truth for all Tradelynk development decisions.*
*When in doubt, re-read this file before writing any code.*
