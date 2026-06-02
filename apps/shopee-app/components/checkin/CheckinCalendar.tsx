import React from 'react'
import { View } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface CalendarDay {
  date: string
  checked: boolean
}

interface CheckinCalendarProps {
  calendar: CalendarDay[]
  checkedInToday: boolean
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const CELL_SIZE = 40

function getDayState(
  dateStr: string,
  checked: boolean,
  checkedInToday: boolean
): 'checked' | 'missed' | 'today-unchecked' | 'future' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const isToday = date.getTime() === today.getTime()

  if (checked) return 'checked'
  if (isToday && !checkedInToday) return 'today-unchecked'
  if (date < today) return 'missed'
  return 'future'
}

export default function CheckinCalendar({ calendar, checkedInToday }: CheckinCalendarProps) {
  const colors = useColors()

  if (!calendar || calendar.length === 0) return null

  // Build grid: find what day of week the first day of the month falls on
  const firstDate = new Date(calendar[0].date)
  firstDate.setHours(0, 0, 0, 0)
  const startDayOfWeek = firstDate.getDay() // 0=Sun, 6=Sat

  // Pad with nulls for alignment
  const cells: (CalendarDay | null)[] = [...Array(startDayOfWeek).fill(null), ...calendar]

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Day-of-week header */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={{ flex: 1, alignItems: 'center' }}>
            <AppText raw variant="labelSmall" color="muted">
              {label}
            </AppText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell, idx) => {
          if (!cell) {
            return (
              <View
                key={`empty-${idx}`}
                style={{ width: `${100 / 7}%`, alignItems: 'center', marginBottom: 8 }}
              />
            )
          }

          const state = getDayState(cell.date, cell.checked, checkedInToday)
          const dayNumber = new Date(cell.date).getDate()

          let bgColor = 'transparent'
          let borderColor = 'transparent'
          let borderWidth = 0
          let textColor = colors.neutrals400

          switch (state) {
            case 'checked':
              bgColor = colors.primary
              textColor = '#fff'
              break
            case 'today-unchecked':
              borderColor = colors.primary
              borderWidth = 2
              textColor = colors.primary
              break
            case 'missed':
              bgColor = colors.neutrals700
              textColor = colors.neutrals400
              break
            case 'future':
              textColor = colors.neutrals500
              break
          }

          return (
            <View
              key={cell.date}
              style={{
                width: `${100 / 7}%`,
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <View
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: CELL_SIZE / 2,
                  backgroundColor: bgColor,
                  borderColor,
                  borderWidth,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <AppText raw variant="labelSmall" style={{ color: textColor, fontWeight: '600' }}>
                  {dayNumber}
                </AppText>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
