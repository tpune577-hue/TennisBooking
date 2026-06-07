# Greenwich Tennis Academy

Domain language for the member booking and club operations system serving Greenwich Tennis Academy under NIWA PRIVATO.

## Organization

**Greenwich Tennis Academy**:
The private members' tennis club whose courts, credits, and bookings this system manages.
_Avoid_: Tennis Club, Tennis Club CRM (use only when referring to the software repository name in developer context)

**NIWA PRIVATO**:
The parent brand operating Greenwich Tennis Academy.
_Avoid_: Using as a synonym for the academy itself

## People

**Member**:
A person with a club account who books courts and holds a credit balance. Most members have the customer role.
_Avoid_: User (too generic), Customer (acceptable only when contrasting with staff systems)

**Coach**:
A person who can be attached to a booking so the member plays with instruction. Represented by a coach profile (price per hour, availability) linked to a member account.
_Avoid_: Trainer, Instructor

**Coach user**:
A member account with a coach role (employee or freelance). Today they use the same self-service screens as members (own bookings, credits, top-up). A dedicated coach schedule view is planned, not yet built.
_Avoid_: Treating "coach" and "coach user" as the same word without context

**Staff**:
Club employees who operate the admin panel (bookings, members, courts, finance). Distinct from super admin, who can change system settings.

## Money

**Credit**:
The club's internal unit used to pay for court and coach time. Members spend credits when they book; they acquire credits by topping up. In practice one credit is purchased for about one Thai baht, but larger top-up packages grant bonus credits beyond that ratio.
_Avoid_: Points, Coins, Wallet balance (say credit balance instead)

**Top-up**:
Converting a Thai baht payment into credits on a member's balance. Done via Omise (PromptPay QR or credit card), not by spending credits.
_Avoid_: Payment (too vague), Recharge

**Payment**:
A record of real-money collection in Thai baht (stored and reported in satang). Successful payments add credits; they are not spent directly on bookings.
_Avoid_: Using payment to mean a credit deduction

**Credit transaction**:
An immutable ledger line when credits move (top-up, booking deduction, refund, expiry, staff adjustment).
_Avoid_: Transaction alone without "credit"

## Products & membership

**Top-up package**:
A fixed bundle mapping a Thai baht price to a number of credits (including optional bonus credits). Defined in application config today, not editable in admin yet.
_Avoid_: Package alone, Credit package (acceptable shorthand in technical docs)

**Tier**:
A membership level that controls booking benefits (court credit discount, maximum hours per booking, advance booking window, and related limits). Each member has one tier.
_Avoid_: Package (when you mean tier), Plan, Level

**Membership package**:
A sellable club product that grants tier benefits for a duration (database schema exists). Not offered through the product flows yet — planned.
_Avoid_: Package alone, Top-up package, Subscription

**Deal**:
A one-time staff-created credit top-up offer for a specific member — custom price and credit amount, sent via LINE and/or email, payable through Omise until the offer expires.
_Avoid_: Package (when you mean fixed top-up bundle), Promotion (too vague)

## Booking

**Booking**:
A reserved court time slot (and optionally a coach) for a member, identified by a reference code, with a lifecycle status such as confirmed or cancelled.
_Avoid_: Reservation alone (acceptable in UI copy only), Appointment

## Channels

**LIFF surface**:
The member experience opened inside the LINE app (booking flow and top-up). Same account and credits as the member dashboard.
_Avoid_: LINE app (too vague), Mini app alone

**Member dashboard**:
The authenticated web area where members (and coach users) manage bookings, credit history, and top-up in a browser. Equivalent capability to the LIFF surface for core money and booking tasks, not a lesser fallback.
_Avoid_: Portal, User panel, CRM (reserved for staff admin)
