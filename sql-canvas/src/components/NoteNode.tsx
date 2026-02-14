import { memo, useState, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

interface NoteNodeData {
  text: string;
  onDelete?: (nodeId: string) => void;
  label?: string;
  onTextChange?: (nodeId: string, text: string) => void;
  locked?: boolean;
  onLockChange?: (nodeId: string, locked: boolean) => void;
}

function NoteNode({ data, id }: NodeProps<NoteNodeData>) {
  const [text, setText] = useState(data.text || '');
  const [label, setLabel] = useState(data.label || `Note #${id}`);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [locked, setLocked] = useState(data.locked || false);

  const handleLockToggle = () => {
    const newLocked = !locked;
    setLocked(newLocked);
    if (data.onLockChange) {
      data.onLockChange(id, newLocked);
    }
  };

  // Update local state when data.text changes (e.g., when loading a canvas)
  useEffect(() => {
    if (data.text !== undefined) {
      setText(data.text);
    }
  }, [data.text]);

  // Update local state when data.label changes (e.g., when loading a canvas)
  useEffect(() => {
    if (data.label !== undefined) {
      setLabel(data.label);
    }
  }, [data.label]);

  // Update text in parent when it changes
  const handleTextChange = (newText: string) => {
    setText(newText);
    if (data.onTextChange) {
      data.onTextChange(id, newText);
    }
  };

  return (
    <div className="rounded-lg shadow-xl border-2 border-yellow-300 w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#fefce8' }}>
      <NodeResizer
        minWidth={250}
        minHeight={150}
        isVisible={true}
        lineClassName="border-yellow-500"
        handleClassName="h-3 w-3 bg-yellow-500 rounded-full"
      />

      {/* Header */}
      <div className="px-4 py-2 rounded-t-lg border-b border-yellow-300 flex justify-between items-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#fef9c3' }}>
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          {isEditingLabel ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingLabel(false);
              }}
              className="nodrag text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1"
              autoFocus
            />
          ) : (
            <div
              className="nodrag text-sm font-semibold text-gray-700 cursor-pointer hover:text-yellow-700 truncate"
              onClick={() => setIsEditingLabel(true)}
              title={label}
            >
              {label}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleLockToggle}
            className={`nodrag px-2 py-1 rounded text-sm font-medium border ${
              locked
                ? 'bg-red-100 border-red-300 hover:bg-red-200'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
            title={locked ? 'Unlock (currently locked)' : 'Lock (currently unlocked)'}
          >
            {locked ? '🔒' : '🔓'}
          </button>
          {data.onDelete && (
            <button
              onClick={() => data.onDelete?.(id)}
              className="nodrag px-3 py-1 rounded text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
            >
              X
            </button>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 p-4 overflow-hidden" style={{ backgroundColor: '#fefce8' }}>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Write your note here..."
          className="nodrag w-full h-full resize-none border-none outline-none text-gray-800 text-sm"
          style={{ fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif', backgroundColor: '#fefce8' }}
        />
      </div>
    </div>
  );
}

export default memo(NoteNode);
