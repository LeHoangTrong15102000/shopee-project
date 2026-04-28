import React, { useState, useMemo } from 'react'
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Search, Mail } from 'lucide-react-native'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  title: string
  items: FaqItem[]
}

const FAQ_DATA: FaqSection[] = [
  {
    title: 'Đơn hàng',
    items: [
      {
        question: 'Làm thế nào để theo dõi đơn hàng?',
        answer: 'Vào mục "Đơn hàng của tôi" trong tài khoản để xem trạng thái đơn hàng.',
      },
      {
        question: 'Tôi có thể hủy đơn hàng không?',
        answer: 'Bạn có thể hủy đơn hàng khi đơn đang ở trạng thái "Chờ xác nhận".',
      },
    ],
  },
  {
    title: 'Thanh toán',
    items: [
      {
        question: 'Các phương thức thanh toán được hỗ trợ?',
        answer: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD) và chuyển khoản ngân hàng.',
      },
      {
        question: 'Làm thế nào để sử dụng voucher?',
        answer: 'Nhập mã voucher tại trang thanh toán để được giảm giá.',
      },
    ],
  },
  {
    title: 'Vận chuyển',
    items: [
      {
        question: 'Thời gian giao hàng là bao lâu?',
        answer: 'Thông thường từ 2-5 ngày làm việc tùy khu vực.',
      },
      {
        question: 'Phí vận chuyển được tính như thế nào?',
        answer: 'Phí vận chuyển được tính dựa trên khoảng cách và trọng lượng đơn hàng.',
      },
    ],
  },
  {
    title: 'Trả hàng',
    items: [
      {
        question: 'Chính sách trả hàng như thế nào?',
        answer: 'Bạn có thể yêu cầu trả hàng trong vòng 7 ngày kể từ khi nhận hàng.',
      },
      {
        question: 'Làm thế nào để yêu cầu trả hàng?',
        answer: 'Vào chi tiết đơn hàng và nhấn nút "Trả hàng" để gửi yêu cầu.',
      },
    ],
  },
  {
    title: 'Tài khoản',
    items: [
      {
        question: 'Làm thế nào để đổi mật khẩu?',
        answer: 'Vào Tài khoản > Cài đặt > Đổi mật khẩu.',
      },
      {
        question: 'Làm thế nào để cập nhật thông tin cá nhân?',
        answer: 'Vào Tài khoản > Sửa hồ sơ để cập nhật thông tin.',
      },
    ],
  },
]

export default function HelpScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA
    const q = searchQuery.toLowerCase()
    return FAQ_DATA.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0)
  }, [searchQuery])

  const handleContact = () => {
    Linking.openURL('mailto:support@shopee.vn')
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('help.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            margin: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.neutrals700,
            backgroundColor: colors.neutrals900,
            gap: 8,
          }}>
          <Search size={16} color={colors.neutrals400} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('help.searchPlaceholder')}
            placeholderTextColor={colors.neutrals400}
            style={{ flex: 1, color: colors.foreground, fontSize: 14 }}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {filteredSections.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <AppText raw variant="bodySmall" color="muted">
                {t('help.noResults')}
              </AppText>
            </View>
          ) : (
            filteredSections.map((section) => (
              <View key={section.title} style={{ marginBottom: 4 }}>
                {/* Section header */}
                <TouchableOpacity
                  onPress={() => toggleSection(section.title)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: colors.neutrals900,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.neutrals800,
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedSections.has(section.title) }}>
                  <AppText raw variant="body" weight="semibold">
                    {section.title}
                  </AppText>
                  {expandedSections.has(section.title) ? (
                    <ChevronUp size={18} color={colors.neutrals400} />
                  ) : (
                    <ChevronDown size={18} color={colors.neutrals400} />
                  )}
                </TouchableOpacity>

                {/* Section items */}
                {expandedSections.has(section.title) &&
                  section.items.map((item, idx) => (
                    <View
                      key={idx}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.neutrals800,
                        backgroundColor: colors.background,
                      }}>
                      <AppText raw variant="bodySmall" weight="semibold" className="mb-1">
                        {item.question}
                      </AppText>
                      <AppText raw variant="bodySmall" color="muted">
                        {item.answer}
                      </AppText>
                    </View>
                  ))}
              </View>
            ))
          )}

          {/* Contact support button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <AppButton variant="outline" onPress={handleContact} className="w-full">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Mail size={16} color={colors.primary} />
                <AppText raw variant="body" style={{ color: colors.primary }}>
                  {t('help.contactButton')}
                </AppText>
              </View>
            </AppButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
