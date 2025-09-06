// Утилиты для измерения производительности

export function measureTime<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const start = performance.now()
  
  return fn().then(result => {
    const end = performance.now()
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`)
    return result
  }).catch(error => {
    const end = performance.now()
    console.log(`❌ ${label} failed after: ${(end - start).toFixed(2)}ms`)
    throw error
  })
}

export function logPerformance(label: string, startTime: number) {
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (duration > 1000) {
    console.warn(`🐌 Slow operation: ${label} took ${duration.toFixed(2)}ms`)
  } else if (duration > 500) {
    console.log(`⚠️ ${label}: ${duration.toFixed(2)}ms`)
  } else {
    console.log(`✅ ${label}: ${duration.toFixed(2)}ms`)
  }
}