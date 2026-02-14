import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  useNodesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import SQLNode from './components/SQLNode';
import NoteNode from './components/NoteNode';
import RectangleNode from './components/RectangleNode';

const nodeTypes: NodeTypes = {
  sqlNode: SQLNode,
  noteNode: NoteNode,
  rectangleNode: RectangleNode,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [nodeId, setNodeId] = useState(2);

  // Use a ref to always have access to the latest nodes
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const updateNodeResults = useCallback((nodeId: string, results: any[] | null) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              results: results,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const updateNodeSQL = useCallback((nodeId: string, sql: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              sql: sql,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              text: text,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const updateNodeLock = useCallback((nodeId: string, locked: boolean) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            draggable: !locked,
            data: {
              ...node.data,
              locked: locked,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Function to get a node by its label - always uses latest nodes from ref
  const getNodeByLabel = useCallback((label: string) => {
    const node = nodesRef.current.find((n) => n.type === 'sqlNode' && n.data.label === label);
    if (!node) return null;
    return {
      results: node.data.results,
      label: node.data.label
    };
  }, []); // No dependencies - always uses ref

  // Initialize first node with delete handler
  useEffect(() => {
    setNodes([
      {
        id: '1',
        type: 'sqlNode',
        position: { x: 250, y: 100 },
        style: { width: 600, height: 400 },
        zIndex: 1, // SQL nodes at level 1
        data: {
          sql: 'SELECT * FROM users LIMIT 10',
          results: null,
          error: null,
          onDelete: deleteNode,
          label: 'SQL Node #1',
          getNodeByLabel,
          onLabelChange: updateNodeLabel,
          onResultsChange: updateNodeResults,
          onSQLChange: updateNodeSQL,
          locked: false,
          onLockChange: updateNodeLock,
        },
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update all nodes with their callbacks
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'sqlNode' && !node.data.getNodeByLabel) {
          return {
            ...node,
            data: {
              ...node.data,
              getNodeByLabel,
              onLabelChange: updateNodeLabel,
              onResultsChange: updateNodeResults,
              onSQLChange: updateNodeSQL,
              onLockChange: updateNodeLock,
            },
          };
        }
        if (node.type === 'noteNode' && !node.data.onTextChange) {
          return {
            ...node,
            data: {
              ...node.data,
              onTextChange: updateNodeText,
              onLockChange: updateNodeLock,
            },
          };
        }
        if (node.type === 'rectangleNode' && !node.data.onLockChange) {
          return {
            ...node,
            data: {
              ...node.data,
              onLockChange: updateNodeLock,
            },
          };
        }
        return node;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]); // Only update when nodes are added/removed

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: nodeId.toString(),
      type: 'sqlNode',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      style: { width: 600, height: 400 },
      zIndex: 1, // SQL nodes at level 1
      data: {
        sql: '-- Write your SQL query here\nSELECT * FROM table_name',
        results: null,
        error: null,
        onDelete: deleteNode,
        label: `SQL Node #${nodeId}`,
        getNodeByLabel,
        onLabelChange: updateNodeLabel,
        onResultsChange: updateNodeResults,
        onSQLChange: updateNodeSQL,
        locked: false,
        onLockChange: updateNodeLock,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nodeId + 1);
  }, [nodeId, setNodes, deleteNode, getNodeByLabel, updateNodeLabel, updateNodeResults, updateNodeSQL, updateNodeLock]);

  const addNoteNode = useCallback(() => {
    const newNode: Node = {
      id: nodeId.toString(),
      type: 'noteNode',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      style: { width: 300, height: 250 },
      zIndex: 10, // Note nodes above SQL nodes
      data: {
        text: '',
        onDelete: deleteNode,
        label: `Note #${nodeId}`,
        onTextChange: updateNodeText,
        locked: false,
        onLockChange: updateNodeLock,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nodeId + 1);
  }, [nodeId, setNodes, deleteNode, updateNodeText, updateNodeLock]);

  const addRectangleNode = useCallback(() => {
    const newNode: Node = {
      id: nodeId.toString(),
      type: 'rectangleNode',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      style: { width: 400, height: 300 },
      data: {
        color: '#e5e7eb',
        onDelete: deleteNode,
        locked: false,
        onLockChange: updateNodeLock,
      },
      zIndex: -1, // Place behind other nodes
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeId(nodeId + 1);
  }, [nodeId, setNodes, deleteNode, updateNodeLock]);

  const saveCanvas = useCallback(() => {
    const canvasState = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        style: node.style,
        zIndex: node.zIndex,
        data: {
          // Save only the necessary data, excluding callbacks
          sql: node.data.sql,
          text: node.data.text,
          label: node.data.label,
          color: node.data.color,
          locked: node.data.locked,
        }
      })),
      nodeId,
    };

    // Create a blob and download as JSON file
    const blob = new Blob([JSON.stringify(canvasState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas-state.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, nodeId]);

  const loadCanvas = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const { nodes: savedNodes, nodeId: savedNodeId } = JSON.parse(event.target?.result as string);

          // Restore nodes with callbacks
          const restoredNodes = savedNodes.map((node: any) => ({
            ...node,
            draggable: node.data.locked ? false : true, // Set draggable based on locked state
            data: {
              ...node.data,
              results: null, // Don't restore results
              error: null,
              onDelete: deleteNode,
              ...(node.type === 'sqlNode' && {
                getNodeByLabel,
                onLabelChange: updateNodeLabel,
                onResultsChange: updateNodeResults,
                onSQLChange: updateNodeSQL,
                onLockChange: updateNodeLock,
              }),
              ...(node.type === 'noteNode' && {
                onTextChange: updateNodeText,
                onLockChange: updateNodeLock,
              }),
              ...(node.type === 'rectangleNode' && {
                onLockChange: updateNodeLock,
              }),
            },
          }));

          setNodes(restoredNodes);
          setNodeId(savedNodeId);
        } catch (error) {
          alert('Failed to load canvas: Invalid file format');
          console.error('Failed to load canvas:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [deleteNode, getNodeByLabel, updateNodeLabel, updateNodeResults, updateNodeSQL, updateNodeText, updateNodeLock, setNodes]);

  const clearCanvas = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setNodes([]);
      setNodeId(2);
    }
  }, [setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={addNode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            + Add SQL Node
          </button>
          <button
            onClick={addNoteNode}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            + Add Note
          </button>
          <button
            onClick={addRectangleNode}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            + Add Rectangle
          </button>
          <div className="flex-shrink-0" style={{ width: '24px' }} />
          <button
            onClick={saveCanvas}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            Save Canvas
          </button>
          <button
            onClick={loadCanvas}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            Load Canvas
          </button>
          <button
            onClick={clearCanvas}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
          >
            Clear Canvas
          </button>
        </div>
      </ReactFlow>
    </div>
  );
}

export default App;
