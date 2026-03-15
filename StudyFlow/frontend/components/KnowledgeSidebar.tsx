'use client';

import { useState } from 'react';

interface SidebarProps {
  files: string[];
  selectedFile: string | null;
  onSelect: (file: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: { [key: string]: FileNode };
}

function buildFileTree(files: string[]): FileNode {
  const root: FileNode = { name: 'root', path: '', type: 'directory', children: {} };

  files.forEach(file => {
    const parts = file.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      if (!current.children[part]) {
        const isFile = index === parts.length - 1;
        current.children[part] = {
          name: part,
          path: isFile ? file : '',
          type: isFile ? 'file' : 'directory',
          children: {}
        };
      }
      current = current.children[part];
    });
  });

  return root;
}

const FileTreeItem = ({ node, level, selectedFile, onSelect }: { node: FileNode, level: number, selectedFile: string | null, onSelect: (file: string) => void }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'file') {
    return (
      <li className="mb-1">
        <button
          onClick={() => onSelect(node.path)}
          style={{ paddingLeft: `${level * 16}px` }}
          className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors truncate ${
            selectedFile === node.path
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {node.name.replace('.md', '')}
        </button>
      </li>
    );
  }

  return (
    <li className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ paddingLeft: `${level * 16}px` }}
        className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 flex items-center"
      >
        <span className="mr-2 transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        {node.name}
      </button>
      {isOpen && (
        <ul>
          {Object.values(node.children).map(child => (
            <FileTreeItem 
              key={child.name} 
              node={child} 
              level={level + 1} 
              selectedFile={selectedFile} 
              onSelect={onSelect} 
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function KnowledgeSidebar({ files, selectedFile, onSelect }: SidebarProps) {
  const fileTree = buildFileTree(files);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">八股文库</h2>
      </div>
      <ul className="p-2">
        {Object.values(fileTree.children).map(node => (
          <FileTreeItem 
            key={node.name} 
            node={node} 
            level={1} 
            selectedFile={selectedFile} 
            onSelect={onSelect} 
          />
        ))}
      </ul>
    </div>
  );
}
