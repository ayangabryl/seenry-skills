# Seenry device mockups

Product visuals the way leading product sites show them: a real app screen, designed as an app screen, inside a
believable device, composed with imagery. Never draw a phone from divs or put a spreadsheet inside one; blind judges
and the owner both marked those pages down as far from the references.

1. **Design the screen as its own page.** `screen.html` at 393×852 (phone) or 1440×900 (laptop), following
   [seenry-apps](../../../seenry-apps/SKILL.md): status bar, large title, one hero number or state, a short list with
   icons from one set, a tab bar, the home indicator. One idea per screen, real numbers that match the page's story,
   body 17px, nothing a visitor can't read at the size the device appears.
2. **Render it:** `node scripts/mockup_screen.mjs screen.html screen.png` (3× for phone, 2× for laptop).
3. **Frame it** with `device.css`:
   ```html
   <figure class="device device--float" style="--w: 300px">
     <div class="device-screen"><img src="screen.png" alt="Penny's September summary"></div>
   </figure>
   ```
   Frames: `device` (black titanium), `device--silver`, `device--light`; `device--tilt-left|right` for an angled
   pair; `laptop` for desktop screens.
4. **Compose, don't float it on nothing.** Patterns from the references:
   - **Device over an image tile row:** three rounded tiles (art, a quiet surface, art or photo) with the device standing
     across the middle one, and at most one UI card lifted out of the screen (`.lifted`). See `demo/index.html`.
   - **Device in a photograph** of the life moment, when a photo route exists.
   - **Angled pair:** two screens that differ (the month view, the alert), tilted toward each other.
   - **UI cards over a painterly or photographic field:** two or three real cards from the app, no device.

Imagery without an image generator: public-domain paintings and drawings from The Met (`seenry-assets` →
`assets.py art "<subject> <medium>"`, CC0), cropped tight so texture reads as a field, and Openverse photos
(`assets.py images`). Record provenance in the assets manifest.
