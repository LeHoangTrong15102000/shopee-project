import React, { useState, useMemo } from 'react'
import { View, ScrollView, TextInput, TouchableOpacity, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Search, Mail } from 'lucide-react-native'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

type FaqSectionKey = 'orders' | 'payment' | 'shipping' | 'returns' | 'account'

const FAQ_SECTION_KEYS: FaqSectionKey[] = ['orders', 'payment', 'shipping', 'returns', 'account']

export default function HelpScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const faqSections = useMemo(
    () =>
      FAQ_SECTION_KEYS.map((sectionKey) => ({
        key: sectionKey,
        title: t(`help.faq.${sectionKey}.title`),
        items: [
          {
            question: t(`help.faq.${sectionKey}.q1`),
            answer: t(`help.faq.${sectionKey}.a1`),
          },
          {
            question: t(`help.faq.${sectionKey}.q2`),
            answer: t(`help.faq.${sectionKey}.a2`),
          },
        ],
      })),
    [t]
  )

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return faqSections
    const q = searchQuery.toLowerCase()
    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchQuery, faqSections])

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}>
          {filteredSections.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <AppText raw variant="bodySmall" color="muted">
                {t('help.noResults')}
              </AppText>
            </View>
          ) : (
            filteredSections.map((section) => (
              <View key={section.key} style={{ marginBottom: 4 }}>
                {/* Section header */}
                <TouchableOpacity
                  onPress={() => toggleSection(section.key)}
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
                  accessibilityState={{ expanded: expandedSections.has(section.key) }}>
                  <AppText raw variant="body" weight="semibold">
                    {section.title}
                  </AppText>
                  {expandedSections.has(section.key) ? (
                    <ChevronUp size={18} color={colors.neutrals400} />
                  ) : (
                    <ChevronDown size={18} color={colors.neutrals400} />
                  )}
                </TouchableOpacity>

                {/* Section items */}
                {expandedSections.has(section.key) &&
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
