/**
 * ✈️ When something is added to the club, a copy of its poster flies in an arc
 * from the card into the 🎟️ My Club tab. When it lands, the tab "catches" it.
 */

/** Fired on window when a flying poster lands (App.tsx makes the tab glow). */
export const CLUB_CATCH_EVENT = 'watchparty:club-catch'

export function flyToClub(from: HTMLElement, image?: string, emoji = '🎟️') {
  const target = document.querySelector<HTMLElement>('[data-club-tab]')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!target || reducedMotion) {
    window.dispatchEvent(new Event(CLUB_CATCH_EVENT))
    return
  }

  const start = from.getBoundingClientRect()
  const end = target.getBoundingClientRect()

  // The flying copy: the poster (or the type's emoji if there is no poster)
  const flyer = document.createElement('div')
  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${start.left}px`,
    top: `${start.top}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
    zIndex: '60',
    pointerEvents: 'none',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgb(0 0 0 / 0.5), 0 0 0 3px var(--color-gold)',
    background: 'var(--color-raised)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
  })
  if (image) {
    const img = document.createElement('img')
    img.src = image
    Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' })
    flyer.appendChild(img)
  } else {
    flyer.textContent = emoji
  }
  document.body.appendChild(flyer)

  // Move from the card's centre to the tab's centre, arcing upwards on the way.
  const dx = end.left + end.width / 2 - (start.left + start.width / 2)
  const dy = end.top + end.height / 2 - (start.top + start.height / 2)
  const endScale = Math.min(0.2, 36 / start.width)

  const flight = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 90}px) scale(0.75) rotate(-8deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(12deg)`, opacity: 0.4 },
    ],
    { duration: 850, easing: 'cubic-bezier(0.45, 0, 0.7, 0.35)', fill: 'forwards' },
  )
  flight.onfinish = () => {
    flyer.remove()
    window.dispatchEvent(new Event(CLUB_CATCH_EVENT))
  }
}
