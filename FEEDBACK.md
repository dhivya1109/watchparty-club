# Feedback from testing with friends

## Round 1 â€” 2026-10-01

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | People reach the home page before logging in | "Create account / Log in" (email + password) comes first, then profile, then the app | âœ… |
| 2 | Themes 1 (Marquee) and 4 (Festival) feel like a generic default design | Two new, distinctive cinema palettes; keep Matinee | âœ… |
| 3 | Spin the wheel is sometimes slow or missing | Find and fix the causes | âœ… |
| 4 | Typing in search: results push the search bar up | A steady search mode â€” the bar stays put | âœ… |
| 5 | Clearing the search jumps back to the home screen | Stay in search until you press Back | âœ… |
| 6 | Club page = endless scrolling with many picks | Compact rows of posters per person; tap for details | âœ… |
| 7 | Completing something forces the review box (keyboard pops up) | Review is optional and only offered after completing | âœ… |

## Round 2 â€” 2026-10-01

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | Log in should use a code from email, not a password or a link | Email â†’ 6-digit code â†’ profile (new people) â†’ app | âœ… (needs email sender set up in Supabase) |
| 2 | Sparkles after "Add to club" feel noisy | Only the sparkles removed (round 3 brought back the card, flying poster and button shine) | âœ… |
| 3 | Not clear how to set my own status on a friend's pick | Full-width "Your status" buttons with labels; a Friends list shows everyone's status | âœ… |
| 4 | "Your picks" cards should feel alive (like the District app) | Soft light sweep + tilt towards your finger | âœ… |

## Round 3 â€” 2026-10-01

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | No way to take something off my list, and removing from the club was hidden | "âž– Remove from my list" and "ðŸ—‘ï¸ Remove from club" buttons at the bottom of every title's details | âœ… |
| 2 | Profile posters only show names, nothing happens on tap | Each poster shows its status/progress; tap opens the details (with that friend's status on top) | âœ… |
| 3 | Add to club should be like before, just without sparkles | Restored the "Added" card, flying poster and button shine; sparkles stay gone | âœ… |
| 4 | Premiere & Drive-in themes feel cluttered | Replaced with two clean themes like Noir/Matinee: ðŸŒ™ Midnight (dark) and ðŸŒ¿ Sage (light) | âœ… |

## Round 4 â€” 2026-10-01

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | Login code has 8 digits, want 6 | Supabase setting: Email OTP Length = 6 (the app accepts 6â€“8) | âœ… (Supabase setting) |
| 2 | Midnight & Sage look generic/AI-made; Matinee's yellow is harsh | ðŸŽ¦ Screening Room (warm cinema dark) and ðŸ“ Script (screenplay paper, typewriter headings); Matinee yellow â†’ soft honey | âœ… |
| 3 | Ticket border cut off at the corners in the details pop-up | Pop-up corners now match the ticket; the side notches get an outline | âœ… |
| 4 | Spin button left-aligned, too close to the wheel | Centred, with more space above it | âœ… |

## Round 5 â€” 2026-10-03

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | "How your club works" repeats "How it works", and its icons look clickable | Box removed; its message moved into "How it works", now plain text with no button-like icons | âœ… |
| 2 | Type chips under the search bar force a choice before typing | Chips only appear once results are showing | âœ… |
| 3 | Only the words in the reel move | The whole film tape (with sprocket holes) runs right to left, seamlessly | âœ… |
| 4 | "Discover everything" goes nowhere; unclear what's clickable | Every ticket is one big button with a button-style action; Discover â†’ search bar | âœ… |

## Round 6 â€” 2026-10-03

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | "Added to the club" card shows on the home screen | Only shown while searching; cleared when you leave search | âœ… |
| 2 | Flashing lights on the "Added" card | Removed | âœ… |
| 3 | Want a Discord-style blue theme | ðŸ’¬ Group Chat: cool greys, blurple, yellow stars | âœ… |
| 4 | âœ• sits outside the details card | Moved inside the ticket's top-right corner | âœ… |

## Round 7 â€” 2026-10-03

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | Icons, buttons and overall look feel like a typical AI template | Emojis-as-icons â†’ one line-icon set (Lucide); flat solid buttons (no gradients/glow); Barlow Condensed + Barlow fonts (cinema signage) instead of Bricolage + DM Sans; solid headline colour; calmer labels; tighter corners; quiet fade instead of pop-ins; no glowing backgrounds | âœ… |

## Round 8 â€” 2026-10-05

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | Some movies never show up | Movies: up to 60 results (was 12); anime/books up to 30; "See all" per type | âœ… |
| 2 | Undo is far away in the bottom card; "Share it Â· rate Â· review" under the button | Undo sits right under "On the shelf" for titles you just added; the extra line is gone | âœ… |
| 3 | Swipe rows need a trackpad | â€¹ â€º arrow buttons on bigger screens | âœ… |
| 4 | +/âˆ’ for episodes and pages is tedious | Draggable progress bar (+/âˆ’ kept for one step); 100% = Completed | âœ… |
| 5 | Review only offered after completing | Quiet "Add a review (optional)" link for every status | âœ… |
| 6 | Picking a type clears the chosen genre on the wheel page | Type and genre are independent, any order | âœ… |
| 8 | No filters on search; Per person table order | Sort (Best match / Top rated / Newest) + genre filter; Per person ranked by most completed | âœ… |

## Round 9 â€” 2026-10-07

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | Need an owner-only page to control clubs and clear the database | Admin page (menu â†’ Admin): all clubs (rename, members, delete), all people (delete), clear content / clear everything. Enforced by the database (supabase/003_admin.sql) | âœ… (run 003_admin.sql) |

## Round 10 â€” 2026-10-14

| # | What happened | Fix | Status |
|---|---|---|---|
| 1 | "Who's here?" is unclear | "Who's watching tonight?" with a one-line explanation | âœ… |
| 2 | No idea where the wheel's pick comes from | "How the wheel picks" rules + a points breakdown (Wants Â· Taste Â· Started) on Top picks and the winner | âœ… |
| 3 | The spin result should reach the people watching | Spins are sent only to the people ticked under "Who's watching tonight?" (pop-up + "Tonight's pick for you, Priya & Akshaya") | âœ… (run 004_tonight_pick.sql) |
