import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AddressCard, { AddressCardProps } from './AddressCard'

export interface SortableAddressCardProps extends AddressCardProps {
  isDragging?: boolean
}

const SortableAddressCard = ({ isDragging, ...props }: SortableAddressCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting
  } = useSortable({
    id: props.address._id,
    disabled: props.isSelectionMode,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSorting ? 0.4 : 1,
    zIndex: isDragging || isSorting ? 50 : 'auto'
  }

  const ringClass = isDragging || isSorting ? 'ring-2 ring-orange/30 ring-offset-2' : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${props.isSelectionMode ? '' : 'cursor-grab active:cursor-grabbing'} ${ringClass} transition-all duration-200`}
      {...(props.isSelectionMode ? {} : { ...attributes, ...listeners })}
    >
      <AddressCard {...props} />
    </div>
  )
}

export default SortableAddressCard
