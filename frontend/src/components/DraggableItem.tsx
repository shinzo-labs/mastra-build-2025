import { colors, typography } from '../theme'

interface DraggableItemProps {
  id: string
  handleDragStart: (event: React.DragEvent) => void
  style?: React.CSSProperties
  icon: React.ReactNode
  label: string
}

const baseItemStyle = {
  width: '100px',
  height: '40px',
  margin: '5px',
  backgroundColor: colors.background.input
} as const

export const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  handleDragStart,
  style,
  icon,
  label
}) => (
  <div
    id={id}
    draggable
    onDragStart={handleDragStart}
    style={{ ...baseItemStyle, ...style }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: typography.sizes.sm,
        padding: '8px 8px'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = colors.background.input}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      <span>{label}</span>
    </div>
  </div>
)
