export interface ProductSummary {
  _id: string
  name: string
  image: string
  price: number
}

export interface LiveStream {
  id: string
  title: string
  thumbnailUrl: string
  viewerCount: number
  streamerName: string
  streamerAvatar: string
  videoUrl: string
  featuredProducts: ProductSummary[]
  isLive: boolean
}
