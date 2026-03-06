const config = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://api-ecom.duthanhduoc.com/',
  // baseUrl: 'http://localhost:3000/',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'https://api-ecom.duthanhduoc.com',
  // socketUrl: 'http://localhost:3000',
  siteUrl: import.meta.env.VITE_SITE_URL ?? 'https://shop.lehoangtrong.com',
  maxSizeUploadAvatar: 1048576, // bytes

  /**
   * Bật/tắt kết nối WebSocket (Socket.IO).
   * - Đặt `true` khi có backend WebSocket server thực sự đang chạy.
   * - Đặt `false` (mặc định) khi chỉ chạy frontend-only → SocketProvider sẽ
   *   giả lập trạng thái 'connected' để tránh hiện banner lỗi kết nối.
   *
   * Enable/disable WebSocket (Socket.IO) connection.
   * - Set `true` when a real backend WebSocket server is running.
   * - Set `false` (default) for frontend-only mode → SocketProvider will
   *   simulate 'connected' status to avoid showing the connection error banner.
   */
  enableSocket: false
}

export default config
