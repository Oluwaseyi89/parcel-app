import { useCallback, useState } from 'react'

export default function useOptimisticMutation() {
  const [isMutating, setIsMutating] = useState(false)

  const run = useCallback(async ({ mutate, applyOptimistic, rollback, onSuccess, onError }) => {
    let rollbackPayload
    setIsMutating(true)
    try {
      if (applyOptimistic) {
        rollbackPayload = applyOptimistic()
      }
      const result = await mutate()
      if (onSuccess) {
        onSuccess(result)
      }
      return result
    } catch (error) {
      if (rollback) {
        rollback(rollbackPayload)
      }
      if (onError) {
        onError(error)
      }
      throw error
    } finally {
      setIsMutating(false)
    }
  }, [])

  return {
    run,
    isMutating,
  }
}
