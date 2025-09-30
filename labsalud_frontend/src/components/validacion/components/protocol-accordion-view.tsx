"use client"

import { useState, useEffect, useCallback } from "react"
import { useApi } from "@/hooks/use-api"
import { ANALYSIS_ENDPOINTS } from "@/config/api"

const LIMIT = 10 // Declare LIMIT variable

interface ProtocolAccordionViewProps {
  filterByState?: string
}

export function ProtocolAccordionView({ filterByState }: ProtocolAccordionViewProps) {
  const [isLoading, setIsLoading] = useState(false) // Declare setIsLoading state
  const [offset, setOffset] = useState(0) // Declare offset state
  const { apiRequest } = useApi() // Declare apiRequest variable

  const fetchProtocols = useCallback(async () => {
    try {
      setIsLoading(true)
      let url = `${ANALYSIS_ENDPOINTS.PROTOCOLS}?limit=${LIMIT}&offset=${offset}`
      if (filterByState) {
        url += `&state=${filterByState}`
      }

      const response = await apiRequest(url)

      // Handle response here
    } catch (error) {
      // Handle error here
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest, offset, filterByState])

  useEffect(() => {
    fetchProtocols()
  }, [fetchProtocols])

  return <div>{/* Render your component here */}</div>
}
