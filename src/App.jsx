import { useEffect, useState } from 'react'
import MainScreen from './screens/MainScreen.jsx'
import HabitDetailScreen from './screens/HabitDetailScreen.jsx'
import CreateHabitScreen from './screens/CreateHabitScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import TeamScreen from './screens/TeamScreen.jsx'
import { getUser, getStartParam } from './telegram.js'
import { api } from './api.js'

const INVITE_PATTERN = /^invite_(\d+)_(.+)$/

export default function App() {
  // simple stack-less navigation: 'main' | 'detail' | 'team' | 'create' | 'edit' | 'profile' | 'settings'
  const [screen, setScreen] = useState('main')
  const [selectedHabit, setSelectedHabit] = useState(null)
  const [joining, setJoining] = useState(false)

  function openHabit(habit) {
    setSelectedHabit(habit)
    setScreen(habit.variant === 'team' ? 'team' : 'detail')
  }

  // If the app was opened via an invite deep link (?startapp=invite_<id>_<token>),
  // join that habit automatically before showing anything else.
  useEffect(() => {
    const match = INVITE_PATTERN.exec(getStartParam() ?? '')
    if (!match) return

    const [, habitId, token] = match
    setJoining(true)
    api
      .joinHabit(habitId, token)
      .then(({ habit, alreadyMember }) => {
        if (!alreadyMember) {
          alert(`Ты присоединился к «${habit.title}»! 🔥`)
        }
        openHabit(habit)
      })
      .catch((err) => alert(`Не удалось присоединиться: ${err.message}`))
      .finally(() => setJoining(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (joining) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Присоединяемся…
      </div>
    )
  }

  if (screen === 'detail' && selectedHabit) {
    return (
      <HabitDetailScreen
        habit={selectedHabit}
        onBack={() => setScreen('main')}
        onUpdated={(updated) => setSelectedHabit((prev) => ({ ...prev, ...updated }))}
        onEdit={(habit) => {
          setSelectedHabit(habit)
          setScreen('edit')
        }}
      />
    )
  }

  if (screen === 'team' && selectedHabit) {
    return (
      <TeamScreen
        habit={selectedHabit}
        onBack={() => setScreen('main')}
        onEdit={(habit) => {
          setSelectedHabit(habit)
          setScreen('edit')
        }}
      />
    )
  }

  if (screen === 'create') {
    return (
      <CreateHabitScreen
        onBack={() => setScreen('main')}
        onCreate={async (habit) => {
          try {
            await api.createHabit(habit)
            setScreen('main')
          } catch (err) {
            alert(err.message)
          }
        }}
      />
    )
  }

  if (screen === 'edit' && selectedHabit) {
    return (
      <CreateHabitScreen
        editingHabit={selectedHabit}
        onBack={() => setScreen('main')}
        onSave={async (id, data) => {
          try {
            await api.updateHabit(id, data)
            setScreen('main')
          } catch (err) {
            alert(err.message)
          }
        }}
        onDelete={async (id) => {
          try {
            await api.deleteHabit(id)
            setSelectedHabit(null)
            setScreen('main')
          } catch (err) {
            alert(err.message)
          }
        }}
      />
    )
  }

  if (screen === 'profile') {
    return <ProfileScreen onBack={() => setScreen('main')} user={getUser()} />
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('main')} user={getUser()} />
  }

  return (
    <MainScreen
      onOpenHabit={openHabit}
      onCreateHabit={() => setScreen('create')}
      onOpenProfile={() => setScreen('profile')}
      onOpenSettings={() => setScreen('settings')}
    />
  )
}
