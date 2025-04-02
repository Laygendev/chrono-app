import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { RefreshCcw, CheckSquare, X } from 'lucide-react';

const CommitDropdown = ({ commits, selectedCommit, onSelectCommit, onRefreshCommits, isRefreshing }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef();
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!buttonRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredCommits = commits.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={buttonRef}>
      <button
        className="w-full pr-4 pl-2 py-2 border border-gray-300 rounded text-left text-black flex items-center justify-between bg-white hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-gray-500" />
          {selectedCommit || '(aucun commit sélectionné)'}
        </span>
        <RefreshCcw
          className={`w-4 h-4 text-gray-500 hover:text-black ${isRefreshing ? 'animate-spin' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onRefreshCommits();
          }}
          title="Rafraîchir"
        />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="fixed inset-0 z-50 bg-white text-black overflow-auto text-sm"
        >
          <div className="sticky top-0 z-10 flex justify-between items-center bg-white border-b p-2 shadow">
            <input
              className="flex-grow px-3 py-2 border rounded text-black placeholder-gray-500"
              placeholder="Rechercher un commit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <button
              className="ml-2 p-1 hover:bg-gray-100 rounded"
              onClick={() => setOpen(false)}
              title="Fermer"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {filteredCommits.length > 0 ? (
            filteredCommits.map((commit, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectCommit(commit);
                  setOpen(false);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b"
              >
                {commit}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400">Aucun commit trouvé</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CommitDropdown;
