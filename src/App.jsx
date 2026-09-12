import { useState } from 'react'
import MainScreen from './screens/MainScreen.jsx'
import HabitDetailScreen from './screens/HabitDetailScreen.jsx'
import CreateHabitScreen from './screens/CreateHabitScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import TeamScreen from './screens/TeamScreen.jsx'
import { getUser } from './telegram.js'
import { api } from './api.js'

export default function App() {
  // simple stack-less navigation: 'main' | 'detail' | 'team' | 'create' | 'settings'
  const [screen, setScreen] = useState('main')
  const [selectedHabit, setSelectedHabit] = useState(null)

  function openHabit(habit) {
    setSelectedHabit(habit)
    setScreen(habit.variant === 'team' ? 'team' : 'detail')
  }

  if (screen === 'detail' && selectedHabit) {
    return <HabitDetailScreen habit={selectedHabit} onBack={() => setScreen('main')} />
  }

  if (screen === 'team' && selectedHabit) {
    return <TeamScreen habit={selectedHabit} onBack={() => setScreen('main')} />
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

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('main')} user={getUser()} />
  }

  return (
    <MainScreen
      onOpenHabit={openHabit}
      onCreateHabit={() => setScreen('create')}
      onOpenSettings={() => setScreen('settings')}
    />
  )
}
