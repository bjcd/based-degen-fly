import { useState, useEffect } from "react"
import { getUserDataByAddress } from "@/lib/web3/neynar"

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

    getUserDataByAddress(address)
      .then((user) => {
        if (user?.username) {
          setUsername(user.username)
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

