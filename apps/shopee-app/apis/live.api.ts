import { LiveStream } from '@/types/live.type'

// TODO: replace with real API call when backend is ready
const mockStreams: LiveStream[] = [
  {
    id: '1',
    title: 'Flash Sale Cuối Tuần - Giảm đến 50%',
    thumbnailUrl: 'https://picsum.photos/seed/live1/400/300',
    viewerCount: 1234,
    streamerName: 'Shopee Official',
    streamerAvatar: 'https://picsum.photos/seed/avatar1/100/100',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    featuredProducts: [
      { _id: 'p1', name: 'Áo thun nam basic', image: 'https://picsum.photos/seed/prod1/200/200', price: 99000 },
      { _id: 'p2', name: 'Tai nghe Bluetooth', image: 'https://picsum.photos/seed/prod2/200/200', price: 250000 },
      { _id: 'p3', name: 'Ốp lưng iPhone', image: 'https://picsum.photos/seed/prod3/200/200', price: 45000 },
    ],
    isLive: true,
  },
  {
    id: '2',
    title: 'Review Mỹ Phẩm Hot Nhất Tháng',
    thumbnailUrl: 'https://picsum.photos/seed/live2/400/300',
    viewerCount: 856,
    streamerName: 'Beauty Corner',
    streamerAvatar: 'https://picsum.photos/seed/avatar2/100/100',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    featuredProducts: [
      { _id: 'p4', name: 'Son môi MAC', image: 'https://picsum.photos/seed/prod4/200/200', price: 450000 },
      { _id: 'p5', name: 'Kem chống nắng', image: 'https://picsum.photos/seed/prod5/200/200', price: 180000 },
    ],
    isLive: true,
  },
  {
    id: '3',
    title: 'Unbox Đồ Công Nghệ Mới',
    thumbnailUrl: 'https://picsum.photos/seed/live3/400/300',
    viewerCount: 2100,
    streamerName: 'Tech Review VN',
    streamerAvatar: 'https://picsum.photos/seed/avatar3/100/100',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    featuredProducts: [
      { _id: 'p6', name: 'Chuột gaming', image: 'https://picsum.photos/seed/prod6/200/200', price: 350000 },
      { _id: 'p7', name: 'Bàn phím cơ', image: 'https://picsum.photos/seed/prod7/200/200', price: 890000 },
    ],
    isLive: true,
  },
  {
    id: '4',
    title: 'Nấu Ăn Cùng Chef Minh',
    thumbnailUrl: 'https://picsum.photos/seed/live4/400/300',
    viewerCount: 543,
    streamerName: 'Chef Minh',
    streamerAvatar: 'https://picsum.photos/seed/avatar4/100/100',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    featuredProducts: [
      { _id: 'p8', name: 'Nồi chiên không dầu', image: 'https://picsum.photos/seed/prod8/200/200', price: 1200000 },
    ],
    isLive: true,
  },
]

export async function getLiveStreams(): Promise<LiveStream[]> {
  // TODO: replace with real API call when backend is ready
  await new Promise((resolve) => setTimeout(resolve, 800))
  return mockStreams
}

export async function getLiveStream(id: string): Promise<LiveStream> {
  // TODO: replace with real API call when backend is ready
  await new Promise((resolve) => setTimeout(resolve, 500))
  const stream = mockStreams.find((s) => s.id === id)
  if (!stream) throw new Error('Stream not found')
  return stream
}