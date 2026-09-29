import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { Avatar } from './Avatar'

/** Header button: shows who you are, and opens a panel to manage the club's members. */
export function MembersMenu() {
  const { data, me, setMe, addMember, renameMember, removeMember } = useClub()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const submitNew = () => {
    if (!newName.trim()) return
    addMember(newName)
    setNewName('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm hover:border-slate-500"
      >
        <Avatar member={me} size={22} />
        <span className="max-w-28 truncate">You: {me.name}</span>
        <span className="text-slate-500">▾</span>
      </button>

      {open && (
        <>
          {/* Clicking outside the panel closes it */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <h3 className="font-semibold">👥 Club members</h3>
            <p className="mt-0.5 text-xs text-slate-400">Tap “Be me” to choose who is using this device.</p>

            <ul className="mt-3 flex flex-col gap-2">
              {data.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Avatar member={m} />
                  <input
                    value={m.name}
                    onChange={(e) => renameMember(m.id, e.target.value)}
                    aria-label="Member name"
                    className="min-w-0 flex-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-sm"
                  />
                  {m.id === me.id ? (
                    <span className="w-14 text-center text-xs text-violet-300">You</span>
                  ) : (
                    <button onClick={() => setMe(m.id)} className="w-14 rounded-md bg-slate-800 py-1 text-xs hover:bg-slate-700">
                      Be me
                    </button>
                  )}
                  <button
                    onClick={() =>
                      confirm(`Remove ${m.name}? Their ratings and progress will be deleted too.`) && removeMember(m.id)
                    }
                    disabled={data.members.length === 1}
                    title="Remove member"
                    className="px-1 text-slate-500 hover:text-red-400 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submitNew()
              }}
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Friend's name"
                className="min-w-0 flex-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
              />
              <button className="rounded-md bg-violet-600 px-3 text-sm font-medium hover:bg-violet-500">+ Add</button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
