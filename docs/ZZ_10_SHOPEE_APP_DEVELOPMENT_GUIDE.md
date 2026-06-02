# 📱 HƯỚNG DẪN ĐẦY ĐỦ: CHẠY VÀ TEST SHOPEE-APP

> **Tài liệu này hướng dẫn chi tiết cách chạy, test và build ứng dụng Shopee-App (React Native + Expo)**
>
> **Ngày tạo:** 22/03/2026
> **Project:** shopee-project/apps/shopee-app

---

## 📋 MỤC LỤC

1. [Chạy App Ngay Bây Giờ](#1-chạy-app-ngay-bây-giờ)
2. [Setup Android Emulator](#2-setup-android-emulator)
3. [Hướng Dẫn Debug Trên Device](#3-hướng-dẫn-debug-trên-device)
4. [Build Production APK/IPA](#4-build-production-apkipa)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. CHẠY APP NGAY BÂY GIỜ

### 1.1. Kiểm Tra Môi Trường

Trước tiên, kiểm tra xem bạn đã cài đủ tools chưa:

```bash
# Kiểm tra Node.js (cần >= 18.x)
node --version

# Kiểm tra pnpm
pnpm --version

# Nếu chưa có pnpm, cài đặt:
npm install -g pnpm
```

### 1.2. Cài Đặt Dependencies

```bash
# Di chuyển vào thư mục project
cd C:\_a_A_NestJS_Microservices\shopee-project

# Cài đặt tất cả dependencies
pnpm install

# Chờ quá trình cài đặt hoàn tất (có thể mất 5-10 phút)
```

### 1.3. Chạy App Bằng Expo Go (Cách Nhanh Nhất)

**Bước 1: Khởi động Metro Bundler**

```bash
cd apps/shopee-app
pnpm start
```

Bạn sẽ thấy output như thế này:

```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

**Bước 2: Cài Expo Go trên điện thoại**

- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS**: https://apps.apple.com/app/expo-go/id982107779

**Bước 3: Quét QR Code**

- **Android**: Mở Expo Go → Tap "Scan QR Code" → Quét QR từ terminal
- **iOS**: Mở Camera app → Quét QR → Tap notification "Open in Expo Go"

**Lưu ý quan trọng:**

- Điện thoại và máy tính phải cùng mạng WiFi
- Nếu không thấy QR code, nhấn `Shift + D` để hiển thị lại
- Nếu lỗi kết nối, thử tắt firewall tạm thời

### 1.4. Chạy Trên Web Browser (Test Nhanh UI)

```bash
cd apps/shopee-app
pnpm web
```

App sẽ tự động mở trên browser tại `http://localhost:8081`

**Ưu điểm:**

- Không cần điện thoại
- Hot reload cực nhanh
- Dùng Chrome DevTools để debug

**Nhược điểm:**

- Một số native features không hoạt động
- UI có thể khác so với mobile

---

## 2. SETUP ANDROID EMULATOR

### 2.1. Cài Đặt Android Studio

**Bước 1: Download Android Studio**

Truy cập: https://developer.android.com/studio

- Chọn phiên bản Windows
- Download file `.exe` (khoảng 1GB)

**Bước 2: Cài Đặt Android Studio**

```
1. Chạy file installer
2. Chọn "Standard" installation
3. Chọn theme (Dark/Light) tùy thích
4. Nhấn "Finish" và chờ download SDK components
```

**Bước 3: Cấu Hình Environment Variables**

Mở PowerShell **với quyền Administrator** và chạy:

```powershell
# Thêm ANDROID_HOME vào Environment Variables
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Thêm platform-tools vào PATH
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
[System.Environment]::SetEnvironmentVariable("Path", "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

**Khởi động lại terminal** sau khi set xong.

Kiểm tra:

```bash
adb --version
# Phải hiển thị: Android Debug Bridge version x.x.x
```

### 2.2. Tạo Android Virtual Device (AVD)

**Bước 1: Mở AVD Manager**

```
1. Mở Android Studio
2. Click "More Actions" → "Virtual Device Manager"
3. Click "Create Device"
```

**Bước 2: Chọn Device**

```
1. Category: Phone
2. Chọn "Pixel 6" (recommended)
3. Click "Next"
```

**Bước 3: Chọn System Image**

```
1. Tab "Recommended"
2. Chọn "Tiramisu" (API Level 33) - Android 13
3. Click "Download" nếu chưa có
4. Sau khi download xong, click "Next"
```

**Bước 4: Verify Configuration**

```
AVD Name: Pixel_6_API_33
Startup orientation: Portrait
Graphics: Automatic

Click "Finish"
```

### 2.3. Chạy App Trên Emulator

**Bước 1: Khởi động Emulator**

Có 2 cách:

**Cách 1: Từ Android Studio**

```
1. Mở AVD Manager
2. Click nút ▶️ (Play) bên cạnh Pixel_6_API_33
3. Chờ emulator khởi động (lần đầu mất 2-3 phút)
```

**Cách 2: Từ Command Line**

```bash
# List tất cả AVDs
emulator -list-avds

# Khởi động emulator
emulator -avd Pixel_6_API_33
```

**Bước 2: Kiểm Tra Emulator Đã Kết Nối**

```bash
adb devices
```

Output phải có dòng:

```
List of devices attached
emulator-5554   device
```

**Bước 3: Chạy App**

```bash
cd C:\_a_A_NestJS_Microservices\shopee-project\apps\shopee-app
pnpm android
```

Lần đầu tiên sẽ:

1. Build Android app (mất 5-10 phút)
2. Cài app lên emulator
3. Khởi động app tự động

**Lần sau chạy nhanh hơn nhiều (30 giây - 1 phút)**

### 2.4. Tips Tối Ưu Emulator

**Tăng RAM cho Emulator:**

```
1. AVD Manager → Click ✏️ (Edit) bên cạnh device
2. Click "Show Advanced Settings"
3. RAM: 4096 MB (nếu máy có >= 16GB RAM)
4. VM heap: 512 MB
5. Click "Finish"
```

**Bật Hardware Acceleration:**

```
1. BIOS → Enable "Intel VT-x" hoặc "AMD-V"
2. Windows → Enable "Hyper-V" (Settings → Apps → Optional Features)
```

**Snapshot để khởi động nhanh:**

```
1. Khởi động emulator
2. Để emulator chạy đến màn hình home
3. Đóng emulator (nó sẽ tự động save snapshot)
4. Lần sau khởi động sẽ nhanh hơn (10-20 giây)
```

---

## 3. HƯỚNG DẪN DEBUG TRÊN DEVICE

### 3.1. Debug Trên Android Device

#### 3.1.1. Chuẩn Bị Device

**Bước 1: Bật Developer Options**

```
1. Settings → About phone
2. Tap "Build number" 7 lần
3. Nhập PIN/Password
4. Thấy thông báo "You are now a developer!"
```

**Bước 2: Bật USB Debugging**

```
1. Settings → System → Developer options
2. Bật "USB debugging"
3. Bật "Install via USB" (nếu có)
```

**Bước 3: Kết Nối USB**

```
1. Cắm dây USB từ điện thoại vào máy tính
2. Trên điện thoại, chọn "File Transfer" mode
3. Cho phép "USB debugging" khi có popup
4. Tick "Always allow from this computer"
```

**Bước 4: Kiểm Tra Kết Nối**

```bash
adb devices
```

Output:

```
List of devices attached
ABC123XYZ       device
```

Nếu hiển thị `unauthorized`, nhấn "Allow" trên điện thoại.

#### 3.1.2. Chạy App Trên Device

```bash
cd apps/shopee-app
pnpm android
```

App sẽ tự động:

1. Build
2. Cài lên điện thoại
3. Khởi động

#### 3.1.3. Debug Wireless (ADB over WiFi)

**Yêu cầu:** Android 11+ hoặc kết nối USB lần đầu

**Bước 1: Kết Nối Lần Đầu Qua USB**

```bash
# Kiểm tra device
adb devices

# Bật TCP/IP mode trên port 5555
adb tcpip 5555
```

**Bước 2: Lấy IP Của Điện Thoại**

```
Settings → About phone → Status → IP address
Ví dụ: 192.168.1.150
```

**Bước 3: Kết Nối Wireless**

```bash
# Kết nối đến IP của điện thoại
adb connect 192.168.1.150:5555
```

Output:

```
connected to 192.168.1.150:5555
```

**Bước 4: Rút Dây USB**

Giờ bạn có thể rút dây USB và vẫn debug được!

```bash
# Kiểm tra
adb devices

# Output:
# 192.168.1.150:5555    device
```

**Bước 5: Chạy App**

```bash
pnpm android
```

**Ngắt kết nối:**

```bash
adb disconnect 192.168.1.150:5555
```

#### 3.1.4. Xem Logs Real-time

**Logcat - Xem tất cả logs:**

```bash
adb logcat
```

**Lọc chỉ logs của app:**

```bash
adb logcat | grep "ReactNativeJS"
```

**Lọc theo tag:**

```bash
adb logcat -s "TAG_NAME"
```

**Clear logs:**

```bash
adb logcat -c
```

#### 3.1.5. React Native Debugger

**Bước 1: Mở Dev Menu**

- Lắc điện thoại HOẶC
- Chạy: `adb shell input keyevent 82`

**Bước 2: Chọn "Debug"**

```
Dev Menu → Debug → Open Debugger
```

Browser sẽ mở tại `http://localhost:8081/debugger-ui`

**Bước 3: Mở Chrome DevTools**

```
F12 → Console tab
```

Giờ bạn có thể:

- Xem console.log()
- Set breakpoints
- Inspect network requests
- Profile performance

### 3.2. Debug Trên iOS Device

**Yêu cầu:**

- macOS
- Xcode
- Apple Developer account (free cũng được)
- iPhone/iPad với cáp Lightning/USB-C

#### 3.2.1. Cài Đặt Xcode

```bash
# Cài Xcode từ App Store
# Hoặc download từ: https://developer.apple.com/xcode/

# Cài Xcode Command Line Tools
xcode-select --install
```

#### 3.2.2. Chuẩn Bị Device

**Bước 1: Bật Developer Mode (iOS 16+)**

```
Settings → Privacy & Security → Developer Mode → ON
Restart iPhone
```

**Bước 2: Trust Computer**

```
1. Cắm iPhone vào Mac
2. Unlock iPhone
3. Tap "Trust" khi có popup
4. Nhập passcode
```

#### 3.2.3. Chạy App Trên iOS Device

```bash
cd apps/shopee-app

# List tất cả devices
xcrun xctrace list devices

# Chạy trên device cụ thể
pnpm ios --device "iPhone của Bạn"
```

Lần đầu tiên:

1. Xcode sẽ mở
2. Chọn Team (Apple ID của bạn)
3. Xcode sẽ sign app
4. App sẽ được cài lên iPhone

**Lỗi "Untrusted Developer":**

```
iPhone → Settings → General → VPN & Device Management
→ Tap Apple ID của bạn → Trust
```

#### 3.2.4. Debug iOS

**Safari Web Inspector:**

```
1. iPhone: Settings → Safari → Advanced → Web Inspector: ON
2. Mac: Safari → Develop → [iPhone Name] → [App Name]
```

**Xcode Console:**

```
1. Xcode → Window → Devices and Simulators
2. Chọn iPhone
3. Click "Open Console"
```

---

## 4. BUILD PRODUCTION APK/IPA

### 4.1. Build Android APK

#### 4.1.1. Build APK Debug (Để Test)

```bash
cd apps/shopee-app/android
./gradlew assembleDebug
```

File APK tại:

```
apps/shopee-app/android/app/build/outputs/apk/debug/app-debug.apk
```

Cài lên điện thoại:

```bash
adb install app-debug.apk
```

#### 4.1.2. Build APK Release (Production)

**Bước 1: Tạo Keystore**

```bash
cd apps/shopee-app/android/app

keytool -genkeypair -v -storetype PKCS12 \
  -keystore shopee-release-key.keystore \
  -alias shopee-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Nhập thông tin:

```
Enter keystore password: [password của bạn]
Re-enter password: [password của bạn]
What is your first and last name? [Tên bạn]
What is the name of your organizational unit? [Tên công ty]
...
```

**Bước 2: Cấu Hình Gradle**

Tạo file `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=shopee-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=shopee-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_password_here
MYAPP_RELEASE_KEY_PASSWORD=your_password_here
```

**Bước 3: Sửa `android/app/build.gradle`**

Thêm vào trong `android { ... }`:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

**Bước 4: Build Release APK**

```bash
cd apps/shopee-app/android
./gradlew assembleRelease
```

File APK tại:

```
apps/shopee-app/android/app/build/outputs/apk/release/app-release.apk
```

**Bước 5: Test APK**

```bash
adb install app-release.apk
```

#### 4.1.3. Build Android App Bundle (AAB) - Để Upload Lên Google Play

```bash
cd apps/shopee-app/android
./gradlew bundleRelease
```

File AAB tại:

```
apps/shopee-app/android/app/build/outputs/bundle/release/app-release.aab
```

**Upload lên Google Play Console:**

```
1. https://play.google.com/console
2. Tạo app mới
3. Upload AAB file
4. Điền thông tin app
5. Submit for review
```
