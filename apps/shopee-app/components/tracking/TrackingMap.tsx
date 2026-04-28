import React, { useRef, useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import MapView, { Marker, Polyline, AnimatedRegion } from 'react-native-maps'
import { TrackingUpdate } from '@/types/tracking.type'

interface TrackingMapProps {
  tracking: TrackingUpdate
  pickupLocation?: { lat: number; lng: number }
  deliveryLocation?: { lat: number; lng: number }
}

const DELTA = 0.02

export default function TrackingMap({
  tracking,
  pickupLocation,
  deliveryLocation,
}: TrackingMapProps) {
  const mapRef = useRef<MapView>(null)
  const driverCoord = useRef(
    new AnimatedRegion({
      latitude: tracking.location.lat,
      longitude: tracking.location.lng,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  )

  // Accumulate driver positions to draw the travelled route
  const [driverPath, setDriverPath] = useState<{ latitude: number; longitude: number }[]>([
    { latitude: tracking.location.lat, longitude: tracking.location.lng },
  ])

  // Animate driver marker on location update and append to path
  useEffect(() => {
    driverCoord.current.timing({
      latitude: tracking.location.lat,
      longitude: tracking.location.lng,
      latitudeDelta: 0,
      longitudeDelta: 0,
      duration: 500,
      useNativeDriver: false,
    }).start()

    mapRef.current?.animateToRegion(
      {
        latitude: tracking.location.lat,
        longitude: tracking.location.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      500,
    )

    setDriverPath((prev) => {
      const last = prev[prev.length - 1]
      if (last?.latitude === tracking.location.lat && last?.longitude === tracking.location.lng) {
        return prev
      }
      return [...prev, { latitude: tracking.location.lat, longitude: tracking.location.lng }]
    })
  }, [tracking.location.lat, tracking.location.lng])

  // Build full route: pickup -> driver path -> delivery
  const routeCoords: { latitude: number; longitude: number }[] = [
    pickupLocation ? { latitude: pickupLocation.lat, longitude: pickupLocation.lng } : null,
    ...driverPath,
    deliveryLocation ? { latitude: deliveryLocation.lat, longitude: deliveryLocation.lng } : null,
  ].filter(Boolean) as { latitude: number; longitude: number }[]

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: tracking.location.lat,
        longitude: tracking.location.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      }}
      accessibilityLabel="Order tracking map">
      {/* Pickup marker */}
      {pickupLocation && (
        <Marker
          coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}
          title="Điểm lấy hàng"
          pinColor="green"
        />
      )}

      {/* Delivery marker */}
      {deliveryLocation && (
        <Marker
          coordinate={{ latitude: deliveryLocation.lat, longitude: deliveryLocation.lng }}
          title="Điểm giao hàng"
          pinColor="red"
        />
      )}

      {/* Animated driver marker */}
      <Marker.Animated
        coordinate={driverCoord.current}
        title={tracking.driverName}
        description={tracking.vehicleInfo}
      />

      {/* Route polyline — drawn from accumulated driver positions */}
      {routeCoords.length >= 2 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#EE4D2D"
          strokeWidth={3}
        />
      )}
    </MapView>
  )
}
