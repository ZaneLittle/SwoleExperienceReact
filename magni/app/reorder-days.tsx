import React from 'react'
import { useRouter } from 'expo-router'
import WorkoutDayReorder from '../components/workouts/WorkoutDayReorder'

export default function ReorderDaysScreen() {
  const router = useRouter()

  return <WorkoutDayReorder onBack={() => router.replace('/settings')} />
}
