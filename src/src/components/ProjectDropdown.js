import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Loader2, AlertCircle, CheckCircle, FolderIcon, ChevronDown, X } from 'lucide-react';

const ProjectDropdown = ({ projects, selectedFile, setSelectedFile }) => {
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

  const filteredProjects = projects.filter(p => p.nomProjet.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={buttonRef}>
      <button
        className="w-full pr-4 pl-2 py-2 border border-gray-300 rounded text-left text-black flex items-center justify-between bg-white hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          <FolderIcon className="w-4 h-4 text-gray-500" />
          {selectedFile || 'Projet'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="fixed inset-0 z-50 bg-white text-black overflow-auto text-sm"
        >
          <div className="sticky top-0 z-10 flex justify-between items-center bg-white border-b p-2 shadow">
            <input
              className="flex-grow px-3 py-2 border rounded text-black placeholder-gray-500"
              placeholder="Rechercher un projet..."
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
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, idx) => {
              const isDisabled = project.isLoading || project.hasHeaderIssue;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (!isDisabled) {
                      setSelectedFile(project.nomProjet);
                      setOpen(false);
                    }
                  }}
                  className={`px-4 py-2 flex items-center gap-2 border-b ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
                >
                  {project.isLoading ? (
                    <Loader2 className="animate-spin text-gray-400 w-4 h-4" />
                  ) : project.hasHeaderIssue ? (
                    <AlertCircle className="text-red-500 w-4 h-4" />
                  ) : (
                    <CheckCircle className="text-green-500 w-4 h-4" />
                  )}
                  <span>{project.nomProjet}</span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-gray-400">Aucun projet trouvé</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectDropdown;
