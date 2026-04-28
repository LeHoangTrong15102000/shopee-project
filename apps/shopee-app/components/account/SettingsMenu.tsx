import React from 'react'
import { View } from 'react-native'
import { Moon, Globe, Lock, Info, Settings } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { MenuList, AppText, Switch } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

interface SettingsMenuProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onLanguage: () => void
  onChangePassword: () => void
  onAbout: () => void
  onSettings: () => void
}

export default function SettingsMenu({
  isDarkMode,
  onToggleDarkMode,
  onLanguage,
  onChangePassword,
  onAbout,
  onSettings,
}: SettingsMenuProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const items = [
    {
      title: t('account.settings.darkMode'),
      icon: () => <Moon size={20} color={colors.foreground} />,
      value: (
        <Switch value={isDarkMode} onValueChange={onToggleDarkMode} size="sm" />
      ) as React.ReactNode,
      onPress: onToggleDarkMode,
    },
    {
      title: t('account.settings.language'),
      icon: () => <Globe size={20} color={colors.foreground} />,
      onPress: onLanguage,
    },
    {
      title: t('account.settings.changePassword'),
      icon: () => <Lock size={20} color={colors.foreground} />,
      onPress: onChangePassword,
    },
    {
      title: t('account.settings.settings'),
      icon: () => <Settings size={20} color={colors.foreground} />,
      onPress: onSettings,
    },
    {
      title: t('account.settings.about'),
      icon: () => <Info size={20} color={colors.foreground} />,
      onPress: onAbout,
    },
  ]

  return (
    <View className="border-t border-neutrals900 px-4 py-4">
      <AppText raw variant="bodySmall" weight="semibold" color="muted" className="mb-3">
        {t('account.section.settings')}
      </AppText>
      <MenuList data={items} />
    </View>
  )
}
