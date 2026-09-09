import { useState } from 'react'
import MainScreen from './screens/MainScreen.jsx'
import HabitDetailScreen from './screens/HabitDetailScreen.jsx'
import CreateHabitScreen from './screens/CreateHabitScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import { getUser } from './telegram.js'

export default function App() {
  // simple stack-less navigation: 'main' | 'detail' | 'create' | 'settings'
  const [screen, setScreen] = useState('main')
  const [selectedHabit, setSelectedHabit] = useState(null)

  if (screen === 'detail' && selectedHabit) {
    return (
      <HabitDetailScreen
        habit={selectedHabit}
        onBack={() => setScreen('main')}
      />
    )
  }

  if (screen === 'create') {
    return (
      <CreateHabitScreen
        onBack={() => setScreen('main')}
        onCreate={(habit) => {
          // wire this up to real storage once the backend exists
          console.log('created habit', habit)
          setScreen('main')
        }}
      />
    )
  }

  if (screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('main')} user={getUser()} />
  }

  return (
    <MainScreen
      onOpenHabit={(habit) => {
        setSelectedHabit(habit)
        setScreen('detail')
      }}
      onCreateHabit={() => setScreen('create')}
      onOpenSettings={() => setScreen('settings')}
    />
  )
}
