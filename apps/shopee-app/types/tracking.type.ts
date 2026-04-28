export interface TrackingLocation {
  lat: number
  lng: number
}

export interface TrackingUpdate {
  _id: string
  orderId: string
  status: string
  location: TrackingLocation
  driverName: string
  driverPhone: string
  vehicleInfo: string
  estimatedArrival: string
  timestamp: string
  createdAt: string
  updatedAt: string
}
