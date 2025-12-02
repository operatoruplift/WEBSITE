import React, { useEffect, useState } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  type: 'primary' | 'secondary' | 'background';
}

interface Connection {
  id: string;
  from: number;
  to: number;
  opacity: number;
}

const NetworkVis: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Generate static nodes similar to the screenshot logic
    // We want a cluster on the right side, somewhat spread out
    const generatedNodes: Node[] = [];
    const width = 800;
    const height = 600;

    // Grid-like structure with some randomness
    for (let i = 0; i < 30; i++) {
      generatedNodes.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        type: Math.random() > 0.8 ? 'primary' : Math.random() > 0.5 ? 'secondary' : 'background',
      });
    }

    // Create connections based on proximity
    const generatedConnections: Connection[] = [];
    generatedNodes.forEach((nodeA, i) => {
      generatedNodes.forEach((nodeB, j) => {
        if (i >= j) return;
        const dist = Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2));
        
        // Connect if close enough, favor horizontal connections slightly for the "flow" look
        if (dist < 200 && Math.random() > 0.6) {
          generatedConnections.push({
            id: `${i}-${j}`,
            from: nodeA.id,
            to: nodeB.id,
            opacity: Math.max(0.1, 1 - dist / 200) * 0.5,
          });
        }
      });
    });

    setNodes(generatedNodes);
    setConnections(generatedConnections);
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden pointer-events-none opacity-60 mix-blend-screen">
      <svg 
        viewBox="0 0 800 600" 
        preserveAspectRatio="xMidYMid slice" 
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#333" stopOpacity="0" />
            <stop offset="50%" stopColor="#666" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#333" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connections */}
        {connections.map((conn) => {
            const start = nodes.find(n => n.id === conn.from);
            const end = nodes.find(n => n.id === conn.to);
            if (!start || !end) return null;

            return (
              <g key={conn.id}>
                 <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={start.type === 'primary' || end.type === 'primary' ? 'rgba(255, 85, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth="1"
                  strokeDasharray={Math.random() > 0.8 ? "4,4" : "none"}
                />
                {/* Moving particle on some lines */}
                {conn.id.charCodeAt(0) % 3 === 0 && (
                   <circle r="2" fill={start.type === 'primary' ? '#FF5500' : '#FFF'}>
                     <animateMotion 
                        dur={`${2 + (conn.id.charCodeAt(0) % 5)}s`} 
                        repeatCount="indefinite"
                        path={`M${start.x},${start.y} L${end.x},${end.y}`}
                     />
                   </circle>
                )}
              </g>
            );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            {/* Glow for primary nodes */}
            {node.type === 'primary' && (
              <circle r="12" fill="url(#line-gradient)" opacity="0.2">
                <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
              </circle>
            )}
            
            <circle 
              r={node.type === 'primary' ? 4 : node.type === 'secondary' ? 3 : 2} 
              fill={node.type === 'primary' ? '#FF5500' : node.type === 'secondary' ? '#888' : '#333'}
            >
               {node.type === 'primary' && (
                  <animate attributeName="r" values="4;5;4" dur="3s" repeatCount="indefinite" />
               )}
            </circle>
            
            {/* Outline ring for some nodes */}
            {node.type !== 'background' && (
                 <circle 
                 r={node.type === 'primary' ? 8 : 6} 
                 fill="none" 
                 stroke={node.type === 'primary' ? '#FF5500' : '#555'}
                 strokeWidth="1"
                 opacity="0.3"
               />
            )}
          </g>
        ))}
      </svg>
      {/* Gradient mask to fade out edges - Strengthened for wider container */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent w-full lg:w-4/5 h-full pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent h-1/4 bottom-0 w-full pointer-events-none"></div>
    </div>
  );
};

export default NetworkVis;