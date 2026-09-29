import type { Member } from '../lib/club'

export function Avatar({ member, size = 24 }: { member: Member; size?: number }) {
  return (
    <span
      title={member.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ backgroundColor: member.color, width: size, height: size, fontSize: size * 0.45 }}
    >
      {member.name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
