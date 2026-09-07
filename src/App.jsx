import { useState } from 'react'
import MainScreen from './screens/MainScreen.jsx'

export default function App() {
  // will grow into real navigation once more screens are wired up
  const [screen] = useState('main')

  if (screen === 'main') return <MainScreen />

  return null
}
