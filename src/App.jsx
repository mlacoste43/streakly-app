import { useState } from 'react'
import MainScreen from './screens/MainScreen.jsx'
import HabitDetailScreen from './screens/HabitDetailScreen.jsx'

export default function App() {
  // simple stack-less navigation: null = main screen, otherwise the selected habit
  const [selectedHabit, setSelectedHabit] = useState(null)

  if (selectedHabit) {
    return <HabitDetailScreen habit={selectedHabit} onBack={() => setSelectedHabit(null)} />
  }

  return <MainScreen onOpenHabit={setSelectedHabit} />
}
