import { ANIMATION_DURATION } from 'src/styles/animations'

export const chipVariants = {
  hidden: { opacity: 0, scale: 0.8, x: -10 },
  visible: { opacity: 1, scale: 1, x: 0, transition: { duration: ANIMATION_DURATION.normal } },
  exit: { opacity: 0, scale: 0.8, x: 10, transition: { duration: ANIMATION_DURATION.fast } }
}

export const panelVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: ANIMATION_DURATION.normal } },
  exit: { opacity: 0, height: 0, transition: { duration: ANIMATION_DURATION.fast } }
}
