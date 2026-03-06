export interface Ward {
  id: string
  name: string
}

export interface District {
  id: string
  name: string
  wards: Ward[]
}

export interface Province {
  id: string
  name: string
  districts: District[]
}

export const vietnamProvinces: Province[] = [
  {
    id: 'hcm',
    name: 'Hồ Chí Minh',
    districts: [
      {
        id: 'q1',
        name: 'Quận 1',
        wards: [
          { id: 'ben-nghe', name: 'Phường Bến Nghé' },
          { id: 'ben-thanh', name: 'Phường Bến Thành' },
          { id: 'co-giang', name: 'Phường Cô Giang' },
          { id: 'cau-kho', name: 'Phường Cầu Kho' },
          { id: 'da-kao', name: 'Phường Đa Kao' },
          { id: 'nguyen-cu-trinh', name: 'Phường Nguyễn Cư Trinh' },
          { id: 'nguyen-thai-binh', name: 'Phường Nguyễn Thái Bình' },
          { id: 'pham-ngu-lao', name: 'Phường Phạm Ngũ Lão' },
          { id: 'tan-dinh', name: 'Phường Tân Định' }
        ]
      },
      {
        id: 'q3',
        name: 'Quận 3',
        wards: [
          { id: 'vo-thi-sau', name: 'Phường Võ Thị Sáu' },
          { id: 'p1', name: 'Phường 1' },
          { id: 'p2', name: 'Phường 2' },
          { id: 'p3', name: 'Phường 3' },
          { id: 'p4', name: 'Phường 4' },
          { id: 'p5', name: 'Phường 5' }
        ]
      },
      {
        id: 'q7',
        name: 'Quận 7',
        wards: [
          { id: 'tan-phu', name: 'Phường Tân Phú' },
          { id: 'tan-thuan-dong', name: 'Phường Tân Thuận Đông' },
          { id: 'tan-thuan-tay', name: 'Phường Tân Thuận Tây' },
          { id: 'tan-kieng', name: 'Phường Tân Kiểng' },
          { id: 'phu-my', name: 'Phường Phú Mỹ' },
          { id: 'phu-thuan', name: 'Phường Phú Thuận' }
        ]
      },
      {
        id: 'binh-thanh',
        name: 'Quận Bình Thạnh',
        wards: [
          { id: 'p1-bt', name: 'Phường 1' },
          { id: 'p2-bt', name: 'Phường 2' },
          { id: 'p3-bt', name: 'Phường 3' },
          { id: 'p11-bt', name: 'Phường 11' },
          { id: 'p12-bt', name: 'Phường 12' },
          { id: 'p13-bt', name: 'Phường 13' },
          { id: 'p14-bt', name: 'Phường 14' }
        ]
      },
      {
        id: 'thu-duc',
        name: 'Thành phố Thủ Đức',
        wards: [
          { id: 'linh-trung', name: 'Phường Linh Trung' },
          { id: 'linh-chieu', name: 'Phường Linh Chiểu' },
          { id: 'linh-tay', name: 'Phường Linh Tây' },
          { id: 'linh-dong', name: 'Phường Linh Đông' },
          { id: 'hiep-binh-chanh', name: 'Phường Hiệp Bình Chánh' },
          { id: 'hiep-binh-phuoc', name: 'Phường Hiệp Bình Phước' },
          { id: 'tam-binh', name: 'Phường Tam Bình' },
          { id: 'tam-phu', name: 'Phường Tam Phú' }
        ]
      }
    ]
  },
  {
    id: 'hn',
    name: 'Hà Nội',
    districts: [
      {
        id: 'hoan-kiem',
        name: 'Quận Hoàn Kiếm',
        wards: [
          { id: 'hang-bac', name: 'Phường Hàng Bạc' },
          { id: 'hang-bo', name: 'Phường Hàng Bồ' },
          { id: 'hang-buom', name: 'Phường Hàng Buồm' },
          { id: 'hang-dao', name: 'Phường Hàng Đào' },
          { id: 'hang-gai', name: 'Phường Hàng Gai' },
          { id: 'hang-ma', name: 'Phường Hàng Mã' },
          { id: 'hang-trong', name: 'Phường Hàng Trống' },
          { id: 'cua-dong', name: 'Phường Cửa Đông' }
        ]
      },
      {
        id: 'ba-dinh',
        name: 'Quận Ba Đình',
        wards: [
          { id: 'cong-vi', name: 'Phường Cống Vị' },
          { id: 'dien-bien', name: 'Phường Điện Biên' },
          { id: 'doi-can', name: 'Phường Đội Cấn' },
          { id: 'giang-vo', name: 'Phường Giảng Võ' },
          { id: 'kim-ma', name: 'Phường Kim Mã' },
          { id: 'lieu-giai', name: 'Phường Liễu Giai' }
        ]
      },
      {
        id: 'dong-da',
        name: 'Quận Đống Đa',
        wards: [
          { id: 'cat-linh', name: 'Phường Cát Linh' },
          { id: 'hang-bot', name: 'Phường Hàng Bột' },
          { id: 'kham-thien', name: 'Phường Khâm Thiên' },
          { id: 'kim-lien', name: 'Phường Kim Liên' },
          { id: 'lang-ha', name: 'Phường Láng Hạ' },
          { id: 'lang-thuong', name: 'Phường Láng Thượng' }
        ]
      },
      {
        id: 'cau-giay',
        name: 'Quận Cầu Giấy',
        wards: [
          { id: 'dich-vong', name: 'Phường Dịch Vọng' },
          { id: 'dich-vong-hau', name: 'Phường Dịch Vọng Hậu' },
          { id: 'mai-dich', name: 'Phường Mai Dịch' },
          { id: 'nghia-do', name: 'Phường Nghĩa Đô' },
          { id: 'nghia-tan', name: 'Phường Nghĩa Tân' },
          { id: 'quan-hoa', name: 'Phường Quan Hoa' },
          { id: 'trung-hoa', name: 'Phường Trung Hòa' },
          { id: 'yen-hoa', name: 'Phường Yên Hòa' }
        ]
      }
    ]
  },
  {
    id: 'dn',
    name: 'Đà Nẵng',
    districts: [
      {
        id: 'hai-chau',
        name: 'Quận Hải Châu',
        wards: [
          { id: 'hai-chau-1', name: 'Phường Hải Châu 1' },
          { id: 'hai-chau-2', name: 'Phường Hải Châu 2' },
          { id: 'thach-thang', name: 'Phường Thạch Thang' },
          { id: 'thanh-binh', name: 'Phường Thanh Bình' },
          { id: 'thuan-phuoc', name: 'Phường Thuận Phước' }
        ]
      },
      {
        id: 'thanh-khe',
        name: 'Quận Thanh Khê',
        wards: [
          { id: 'an-khe', name: 'Phường An Khê' },
          { id: 'chinh-gian', name: 'Phường Chính Gián' },
          { id: 'hoa-khe', name: 'Phường Hòa Khê' },
          { id: 'tam-thuan', name: 'Phường Tam Thuận' },
          { id: 'tan-chinh', name: 'Phường Tân Chính' }
        ]
      }
    ]
  },
  {
    id: 'ct',
    name: 'Cần Thơ',
    districts: [
      {
        id: 'ninh-kieu',
        name: 'Quận Ninh Kiều',
        wards: [
          { id: 'an-binh', name: 'Phường An Bình' },
          { id: 'an-cu', name: 'Phường An Cư' },
          { id: 'an-hoa', name: 'Phường An Hòa' },
          { id: 'an-nghiep', name: 'Phường An Nghiệp' },
          { id: 'cai-khe', name: 'Phường Cái Khế' },
          { id: 'hung-loi', name: 'Phường Hưng Lợi' }
        ]
      },
      {
        id: 'binh-thuy',
        name: 'Quận Bình Thủy',
        wards: [
          { id: 'binh-thuy-p', name: 'Phường Bình Thủy' },
          { id: 'bui-huu-nghia', name: 'Phường Bùi Hữu Nghĩa' },
          { id: 'long-hoa', name: 'Phường Long Hòa' },
          { id: 'long-tuyen', name: 'Phường Long Tuyền' },
          { id: 'tra-an', name: 'Phường Trà An' }
        ]
      }
    ]
  },
  {
    id: 'hp',
    name: 'Hải Phòng',
    districts: [
      {
        id: 'hong-bang',
        name: 'Quận Hồng Bàng',
        wards: [
          { id: 'hoang-van-thu', name: 'Phường Hoàng Văn Thụ' },
          { id: 'minh-khai', name: 'Phường Minh Khai' },
          { id: 'phan-boi-chau', name: 'Phường Phan Bội Châu' },
          { id: 'quang-trung', name: 'Phường Quang Trung' },
          { id: 'trai-cau', name: 'Phường Trại Cau' }
        ]
      },
      {
        id: 'le-chan',
        name: 'Quận Lê Chân',
        wards: [
          { id: 'an-bien', name: 'Phường An Biên' },
          { id: 'an-duong', name: 'Phường An Dương' },
          { id: 'cat-dai', name: 'Phường Cát Dài' },
          { id: 'dong-hai', name: 'Phường Đông Hải' },
          { id: 'hang-kenh', name: 'Phường Hàng Kênh' }
        ]
      }
    ]
  }
]

export type AddressType = 'home' | 'office' | 'other'

export interface RecentAddress {
  id: string
  street: string
  fullAddress: string
  timestamp: number
}

export const streetSuggestions: string[] = [
  '123 Đường Lê Lợi',
  '456 Đường Nguyễn Huệ',
  '789 Đường Trần Hưng Đạo',
  '101 Đường Hai Bà Trưng',
  '202 Đường Lý Tự Trọng',
  '303 Đường Pasteur',
  '404 Đường Nam Kỳ Khởi Nghĩa',
  '505 Đường Điện Biên Phủ',
  '606 Đường Võ Văn Tần',
  '707 Đường Cách Mạng Tháng 8',
  '808 Đường Nguyễn Thị Minh Khai',
  '909 Đường Lê Duẩn',
  '111 Đường Phạm Ngọc Thạch',
  '222 Đường Nguyễn Đình Chiểu',
  '333 Đường Võ Thị Sáu'
]

export const getDistrictsByProvince = (provinceId: string): District[] => {
  const province = vietnamProvinces.find((p) => p.id === provinceId)
  return province?.districts || []
}

export const getWardsByDistrict = (provinceId: string, districtId: string): Ward[] => {
  const province = vietnamProvinces.find((p) => p.id === provinceId)
  const district = province?.districts.find((d) => d.id === districtId)
  return district?.wards || []
}

export const getProvinceNameById = (provinceId: string): string => {
  return vietnamProvinces.find((p) => p.id === provinceId)?.name || ''
}

export const getDistrictNameById = (provinceId: string, districtId: string): string => {
  const province = vietnamProvinces.find((p) => p.id === provinceId)
  return province?.districts.find((d) => d.id === districtId)?.name || ''
}

export const getWardNameById = (provinceId: string, districtId: string, wardId: string): string => {
  const province = vietnamProvinces.find((p) => p.id === provinceId)
  const district = province?.districts.find((d) => d.id === districtId)
  return district?.wards.find((w) => w.id === wardId)?.name || ''
}
