import React from 'react'
import { View, Image } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import type { CmsBlock } from '@/apis/cmsPages.api'

// ─── Block sub-components ─────────────────────────────────────────────────────

function HeroBannerBlock({ data }: { data: Record<string, unknown> }) {
  const colors = useColors()
  const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : null
  const title = typeof data.title === 'string' ? data.title : ''
  const subtitle = typeof data.subtitle === 'string' ? data.subtitle : null
  const bgColor = typeof data.backgroundColor === 'string' ? data.backgroundColor : colors.primary

  return (
    <View
      style={{
        backgroundColor: bgColor,
        minHeight: 160,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      accessibilityRole="image"
      accessibilityLabel={title}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 160, borderRadius: 0 }}
          resizeMode="cover"
        />
      ) : null}
      <AppText raw variant="heading3" weight="bold" style={{ color: '#fff', marginTop: 8 }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText raw variant="bodySmall" style={{ color: '#fff', marginTop: 4 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  )
}

function TextContentBlock({ data }: { data: Record<string, unknown> }) {
  const alignment =
    data.alignment === 'right' ? 'right' : data.alignment === 'center' ? 'center' : 'left'
  const content = typeof data.content === 'string' ? data.content : ''

  return (
    <View style={{ padding: 16 }}>
      <AppText raw variant="body" align={alignment as 'left' | 'center' | 'right'}>
        {content}
      </AppText>
    </View>
  )
}

function SpacerBlock({ data }: { data: Record<string, unknown> }) {
  const height = typeof data.height === 'number' ? data.height : 16
  return <View style={{ height }} />
}

// ─── Block type → component map ───────────────────────────────────────────────

type BlockRenderer = (props: { data: Record<string, unknown> }) => React.ReactElement | null

const BLOCK_RENDERERS: Partial<Record<string, BlockRenderer>> = {
  hero_banner: HeroBannerBlock,
  text_content: TextContentBlock,
  spacer: SpacerBlock,
  // product_carousel, category_grid, image_gallery, countdown_timer, video_embed:
  // not yet rendered natively — skipped safely (forward-compatible with future additions)
}

// ─── CmsBlockRenderer ─────────────────────────────────────────────────────────

interface CmsBlockRendererProps {
  blocks: CmsBlock[]
}

export default function CmsBlockRenderer({ blocks }: CmsBlockRendererProps) {
  return (
    <>
      {blocks.map((block, index) => {
        const Renderer = BLOCK_RENDERERS[block.type]
        if (!Renderer) {
          // Unknown or unimplemented block type — skip silently
          if (__DEV__) {
            console.log(`[CmsBlockRenderer] skipping unsupported block type: "${block.type}"`)
          }
          return null
        }
        return (
          <View key={index}>
            <Renderer data={block.data} />
          </View>
        )
      })}
    </>
  )
}
