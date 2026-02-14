import { memo, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

interface RectangleNodeData {
  color: string;
  onDelete?: (nodeId: string) => void;
  locked?: boolean;
  onLockChange?: (nodeId: string, locked: boolean) => void;
}

function RectangleNode({ data, id }: NodeProps<RectangleNodeData>) {
  const [color, setColor] = useState(data.color || '#e5e7eb');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [locked, setLocked] = useState(data.locked || false);

  const handleLockToggle = () => {
    const newLocked = !locked;
    setLocked(newLocked);
    if (data.onLockChange) {
      data.onLockChange(id, newLocked);
    }
  };

  const predefinedColors = [
    { name: 'Gray', value: '#e5e7eb' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Green', value: '#d1fae5' },
    { name: 'Yellow', value: '#fef3c7' },
    { name: 'Red', value: '#fee2e2' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Pink', value: '#fce7f3' },
    { name: 'Orange', value: '#fed7aa' },
  ];

  return (
    <div
      className="w-full h-full rounded-lg border-2 border-gray-300"
      style={{ backgroundColor: color, opacity: 0.6 }}
    >
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={true}
        lineClassName="border-gray-400"
        handleClassName="h-3 w-3 bg-gray-400 rounded-full"
      />

      {/* Control Panel */}
      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, display: 'flex', gap: '4px' }}>
        <button
          onClick={handleLockToggle}
          className={`nodrag px-2 py-1 rounded text-xs font-medium border shadow-sm ${
            locked
              ? 'bg-red-100 border-red-300 hover:bg-red-200'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
          title={locked ? 'Unlock (currently locked)' : 'Lock (currently unlocked)'}
        >
          {locked ? '🔒' : '🔓'}
        </button>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="nodrag px-2 py-1 rounded text-xs font-medium bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
          title="Change Colour"
        >
          ▼
        </button>
      </div>

      {/* Colour Picker Panel */}
      {showColorPicker && (
        <div
          className="nodrag bg-white rounded shadow-xl border border-gray-300"
          style={{
            position: 'absolute',
            top: '38px',
            right: '8px',
            padding: '8px',
            width: '140px',
            zIndex: 30
          }}
        >
          <div className="text-xs font-semibold text-gray-700" style={{ marginBottom: '6px' }}>Choose Colour</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {predefinedColors.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setColor(c.value);
                  setShowColorPicker(false);
                }}
                className="rounded border hover:border-gray-400"
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: c.value,
                  borderColor: color === c.value ? '#374151' : '#d1d5db'
                }}
                title={c.name}
              />
            ))}
          </div>
          <div className="border-t border-gray-200" style={{ marginTop: '8px', paddingTop: '6px' }}>
            <label className="text-xs font-medium text-gray-700 block" style={{ marginBottom: '4px' }}>Custom</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="nodrag rounded cursor-pointer"
              style={{ width: '100%', height: '24px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RectangleNode);
