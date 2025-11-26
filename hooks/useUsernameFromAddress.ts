import { useState, useEffect } from "react"
import { fetchFarcasterProfile } from "@/lib/farcaster-profiles"

export function useUsernameFromAddress(address: `0x${string}` | undefined) {
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!address) {
      setUsername(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    fetchFarcasterProfile(address)
      .then((profile) => {
        if (profile?.username) {
          setUsername(profile.username)
        } else {
          setUsername(null)
        }
      })
      .catch((err) => {
        console.error("Error fetching username:", err)
        setError(err)
        setUsername(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [address])

  return { username, isLoading, error }
}

