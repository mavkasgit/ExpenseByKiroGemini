'use client'

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Input } from '@/components/ui';
import { useState, useRef, useEffect } from 'react';
import type { CategoryGroup } from '@/types';
import { availableIcons, availableColors, getRandomColor } from '@/lib/utils/constants';

function EditGroupForm({ group, onSave, onCancel }: { group: CategoryGroup, onSave: Function, onCancel: Function }) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color || '#6b7280');
  const [icon, setIcon] = useState(group.icon || 'other');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
  }, []);

  return (
    <div className="flex-1 space-y-3 p-2">
      <Input 
        ref={inputRef}
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Название группы" 
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onSave(group, name, icon, color); }
          if (e.key === 'Escape') { onCancel(); }
        }}
      />
      <div className="flex items-center">
        <label className="text-sm font-medium text-gray-700 mr-3">Цвет</label>
        <div className="flex-1 flex space-x-1 overflow-x-auto p-1">
          {availableColors.slice(0, 12).map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150 ${color === c ? 'ring-2 ring-offset-1 ring-blue-500 border-white' : 'border-transparent'}`} style={{ backgroundColor: c }}>
              {color === c && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setColor(getRandomColor())}>🎲</Button>
      </div>
      <div className="flex items-center">
        <label className="text-sm font-medium text-gray-700 mr-3">Иконка</label>
        <div className="flex-1 flex space-x-1 overflow-x-auto p-1">
          {availableIcons.slice(0, 16).map(i => <button key={i.key} type="button" onClick={() => setIcon(i.key)} className={`w-9 h-9 p-1 rounded border flex-shrink-0 ${icon === i.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>{i.emoji}</button>)}
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onCancel()}>Отмена</Button>
        <Button variant="primary" size="sm" onClick={() => onSave(group, name, icon, color)}>Сохранить</Button>
      </div>
    </div>
  );
}

export function SortableGroupItem({ group, onEdit, onDelete, onSave, onCancel, editingGroup }: { group: CategoryGroup, onEdit: Function, onDelete: Function, onSave: Function, onCancel: Function, editingGroup: CategoryGroup | null }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border-2 rounded-lg transition-all duration-200 overflow-hidden">
      <div className={`flex items-center justify-between p-3 transition-opacity duration-200 ${editingGroup?.id === group.id ? 'opacity-50' : 'opacity-100'}`}>
        <div className="flex items-center space-x-3 flex-1">
          <button {...attributes} {...listeners} className="cursor-move p-2 text-gray-400 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: (group.color || '#ccc') + '20' }}>
            <span>{availableIcons.find(icon => icon.key === group.icon)?.emoji || '📦'}</span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{group.name}</div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(group)}>Редактировать</Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(group)}>Удалить</Button>
        </div>
      </div>
      {editingGroup?.id === group.id && (
        <div className="transition-all duration-300 ease-in-out">
          <EditGroupForm group={group} onSave={onSave} onCancel={onCancel} />
        </div>
      )}
    </div>
  );
}