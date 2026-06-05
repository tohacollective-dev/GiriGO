'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface PlaceResult {
  address:      string
  lat:          number
  lng:          number
  display_name: string
}

type GMaps = any
type GooglePlacesAutocomplete = any

// ── Singleton: lazy-load Google Maps script ───────────────────────────────────

let loadPromise: Promise<GMaps | null> | null = null

function loadGoogleMaps(): Promise<GMaps | null> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise(resolve => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || typeof window === 'undefined') { resolve(null); return }
    if ((window as any).google?.maps) { resolve((window as any).google); return }

    const script = document.createElement('script')
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`
    script.async   = true
    script.defer   = true
    script.onload  = () => resolve((window as any).google)
    script.onerror = () => { loadPromise = null; resolve(null) }
    document.head.appendChild(script)
  })

  return loadPromise
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGoogleMaps() {
  const [maps,     setMaps]     = useState<GMaps | null>(null)
  const [loading,  setLoading]  = useState(true)
  const autocompleteRefs = useRef<Map<HTMLInputElement, GooglePlacesAutocomplete>>(new Map())

  useEffect(() => {
    loadGoogleMaps().then(g => { setMaps(g); setLoading(false) })
  }, [])

  // Bind Places Autocomplete to an input element
  const initAutocomplete = useCallback(
    (input: HTMLInputElement | null, onPlace: (place: PlaceResult) => void) => {
      if (!input || !maps) return

      // Remove old listener if re-binding
      const existing = autocompleteRefs.current.get(input)
      if (existing) {
        maps.maps.event.clearInstanceListeners(existing)
      }

      const autocomplete = new maps.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'id' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['address'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry?.location) {
          onPlace({
            address:      input.value || place.formatted_address || place.name || '',
            lat:          place.geometry.location.lat(),
            lng:          place.geometry.location.lng(),
            display_name: place.formatted_address || place.name || input.value || '',
          })
        }
      })

      autocompleteRefs.current.set(input, autocomplete)
    },
    [maps],
  )

  return { maps, mapsLoading: loading, initAutocomplete }
}
