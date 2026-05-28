/**
 * @file 会议室时段工具
 */

function buildTimeSlots(openTime, closeTime) {
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)
  const slots = []
  let currentHour = openHour
  let currentMin = openMin

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
    const nextMin = currentMin + 30
    let nextHour = currentHour + Math.floor(nextMin / 60)
    const nextMinute = nextMin % 60

    if (nextHour > closeHour || (nextHour === closeHour && nextMinute > closeMin)) {
      break
    }

    const endTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
    slots.push({ start: startTime, end: endTime })
    currentMin = nextMinute
    currentHour = nextHour
  }

  return slots
}

function getDayAvailability(slots, bookings) {
  if (!slots.length) return 'full'

  let availableCount = 0
  for (const slot of slots) {
    const occupied = (bookings || []).some(b => slot.start < b.endTime && slot.end > b.startTime)
    if (!occupied) availableCount++
  }

  if (availableCount === 0) return 'full'
  if (availableCount < slots.length) return 'partial'
  return 'free'
}

function enumerateDates(startDate, endDate) {
  const dates = []
  const partsStart = startDate.split('-').map(Number)
  const partsEnd = endDate.split('-').map(Number)
  const cursor = new Date(partsStart[0], partsStart[1] - 1, partsStart[2])
  const end = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2])

  while (cursor <= end) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

module.exports = {
  buildTimeSlots,
  getDayAvailability,
  enumerateDates
}
