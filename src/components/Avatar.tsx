import type { Member } from '../lib/club'

/** A member's round avatar: their emoji if they picked one, otherwise their first letter. */
export function Avatar({ member, size = 24 }: { member: Member; size?: number }) {
  return (
    <span
      title={member.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        backgroundColor: member.color,
        width: size,
        height: size,
        fontSize: member.emoji ? size * 0.55 : size * 0.45,
      }}
    >
      {member.emoji || member.name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
