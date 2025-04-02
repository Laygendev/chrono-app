import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { CheckSquare, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const CommitDropdown = ({ commits, selectedCommit, setSelectedCommit, setSelectedCommitUrl, setMessage, refreshCommits, isRefreshing }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef();
  const dropdownRef = useRef();
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    }
  }, [open]);

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

  const filteredCommits = commits.filter(commit => commit.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (value) => {
    setSelectedCommit(value);
    setOpen(false);

    // Réinitialise
    setSelectedCommitUrl("");
    setMessage("");

    // Cherche un numéro d'issue : #123
    const issueMatch = value.match(/#(\d+)/);
    if (issueMatch) {
      const ref = issueMatch[1];
      setSelectedCommitUrl(`https://tracker.lajungle.fr/issues/${ref}`);
    }

    // Si on trouve aussi un titre après le tiret
    const messageMatch = value.match(/-\s*(.*)$/);
    if (messageMatch) {
      setMessage(messageMatch[1]);
    }
  };

  return (
    <div className="relative w-full" ref={buttonRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full pr-9 pl-2 py-2 border border-gray-300 rounded text-left text-black flex items-center justify-between bg-white hover:bg-gray-100"
      >
        <span className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-gray-500" />
          {selectedCommit || '(aucun commit)'}
        </span>
        <motion.div
          onClick={(e) => {
            e.stopPropagation();
            refreshCommits();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
          title="Rafraîchir les commits"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: 'linear' }}
          >
            <RefreshCcw className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white shadow-xl border rounded max-h-96 overflow-auto text-black"
          style={{
            position: 'absolute',
            top: coords.top,
            left: 0,
            right: 0,
            margin: '0 auto',
            width: '90%',
          }}
        >
          <div className="p-2 border-b">
            <input
              className="w-full px-3 py-2 border rounded text-black placeholder-gray-500"
              placeholder="Rechercher un commit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {filteredCommits.length > 0 ? (
            filteredCommits.map((commit, index) => (
              <div
                key={index}
                onClick={() => handleSelect(commit)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {commit}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400 text-sm">Aucun commit trouvé</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CommitDropdown;