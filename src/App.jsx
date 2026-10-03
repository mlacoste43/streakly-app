import { useState } from 'react'
import MainScreen from './screens/MainScreen.jsx'
import HabitDetailScreen from './screens/HabitDetailScreen.jsx'
import CreateHabitScreen from './screens/CreateHabitScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import TeamScreen from './screens/TeamScreen.jsx'
import { getUser } from './telegram.js'
import { api } from './api.js'

export default function App() {
  // simple stack-less navigation: 'main' | 'detail' | 'team' | 'create' | 'edit' | 'profile' | 'settings'
  const [screen, setScreen] = useState('main')
  const [selectedHabit, setSelectedHabit] = useState(null)

  function openHabit(habit) {
    setSelectedHabit(habit)
    setScreen(habit.variant === 'team' ? 'team' : 'detail')
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
