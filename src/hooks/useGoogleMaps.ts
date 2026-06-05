'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

// ── Types ────────────────────────────────────────────────────────────────────
export interface PlaceResult {
  address: string
  lat: number
  lng: number
  display_name: string
}

export interface UseGoogleMapsReturn {
  isLoaded: boolean
  placesReady: boolean
  mapsError: string | null
  mapsLoading: boolean
  initAutocomplete: (
    input: HTMLInputElement | null,
    onPlace: (place: PlaceResult) => void
  ) => google.maps.places.Autocomplete | undefined
}

// ── Singleton loader configuration ───────────────────────────────────────────
const MAPS_LIBRARIES: Array<'places'> = ['places']

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useGoogleMaps(): UseGoogleMapsReturn {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'girigo-maps',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAPS_LIBRARIES,
    language: 'id',
    region: 'ID',
  })

  const [mapsError, setMapsError] = useState<string | null>(null)
  const [placesReady, setPlacesReady] = useState(false)
  const autocompleteRefs = useRef<Map<HTMLInputElement, google.maps.places.Autocomplete>>(new Map())
  const placesCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (loadError) {
      setMapsError('Google Maps gagal dimuat. Gunakan pilihan zona.')
      return
    }
  }, [loadError])

  // ── Poll for Places.Autocomplete readiness ──────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return

    if (window.google?.maps?.places?.Autocomplete) {
      setPlacesReady(true)
      return
    }

    let attempts = 0
    const maxAttempts = 50

    placesCheckInterval.current = setInterval(() => {
      attempts++
      if (window.google?.maps?.places?.Autocomplete) {
        setPlacesReady(true)
        if (placesCheckInterval.current) {
          clearInterval(placesCheckInterval.current)
          placesCheckInterval.current = null
        }
        return
      }
      if (attempts >= maxAttempts) {
        setMapsError('Places API gagal diinisialisasi. Silakan muat ulang.')
        if (placesCheckInterval.current) {
          clearInterval(placesCheckInterval.current)
          placesCheckInterval.current = null
        }
      }
    }, 100)

    return () => {
      if (placesCheckInterval.current) {
        clearInterval(placesCheckInterval.current)
        placesCheckInterval.current = null
      }
    }
  }, [isLoaded])

  // ── Cleanup all autocomplete instances on unmount ───────────────────────────
  useEffect(() => {
    const refs = autocompleteRefs.current
    return () => {
      refs.forEach((autocomplete) => {
        google.maps.event.clearInstanceListeners(autocomplete)
      })
      refs.clear()
    }
  }, [])

  // ── Bind Places Autocomplete to an input element ────────────────────────────
  const initAutocomplete = useCallback(
    (
      input: HTMLInputElement | null,
      onPlace: (place: PlaceResult) => void
    ): google.maps.places.Autocomplete | undefined => {
      if (!input) return
      if (!placesReady) return
      if (!window.google?.maps?.places?.Autocomplete) {
        console.warn('[GiriGo] google.maps.places.Autocomplete not available')
        return
      }

      // Clean up previous binding on this element
      const existing = autocompleteRefs.current.get(input)
      if (existing) {
        google.maps.event.clearInstanceListeners(existing)
        autocompleteRefs.current.delete(input)
      }

      try {
        const autocomplete = new google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: 'id' },
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['address'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place.geometry?.location) {
            onPlace({
              address: input.value || place.formatted_address || place.name || '',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              display_name: place.formatted_address || place.name || input.value || '',
            })
          }
        })

        autocompleteRefs.current.set(input, autocomplete)
        return autocomplete
      } catch (err) {
        console.warn('[GiriGo] Autocomplete init failed:', err)
        return
      }
    },
    [placesReady],
  )

  return {
    isLoaded,
    placesReady,
    mapsError,
    mapsLoading: !isLoaded && !loadError,
    initAutocomplete,
  }
}
