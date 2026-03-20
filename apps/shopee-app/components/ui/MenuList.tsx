import { JSX } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Icon from '@/components/ui/Icon.tsx';
import AppText from '@/components/ui/AppText.tsx';

interface MenuListItem {
  title: string;
  value?: string | React.ReactNode;
  icon: () => JSX.Element;
  onPress?: () => void;
}

interface MenuListProps {
  data: MenuListItem[];
}

export default function MenuList(props: MenuListProps) {
  return (
    <View className={'flex flex-col gap-2'}>
      {props.data.map((item, index) => (
        <Pressable
          onPress={item.onPress}
          key={index}
          className={'flex flex-row items-center gap-4 py-1'}>
          <View
            className={
              'flex h-16 w-16 items-center justify-center rounded-2xl border border-neutrals900 bg-neutrals1000'
            }>
            <item.icon />
          </View>
          <View className={'flex-1'}>
            <Text className={'font-sans-regular text-lg text-foreground'}>{item.title}</Text>
          </View>
          <View className={'flex-row items-center'}>
            {item.value !== undefined &&
              (typeof item.value === 'string' ? (
                <Text className={'font-sans-regular text-sm text-neutrals300'}>{item.value}</Text>
              ) : (
                item.value
              ))}
            <Icon name={'ChevronRight'} className={'w-6 text-neutrals600'} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}
