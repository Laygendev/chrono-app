import React, { useState, useEffect } from 'react';
import { X, Check, FolderIcon, ClockIcon, CheckSquare, Plus, Minus, CircleDashed, RefreshCcw } from 'lucide-react';
import ProjectDropdown from './ProjectDropdown';
import Logger from 'electron-log';
import { motion, AnimatePresence } from 'framer-motion';
import CommitDropdown from './CommitDropdown';

const TimerModal = ({ onClose, time, onSuccess, projectList, setProjectList }) => {
  const [editedTime, setEditedTime] = useState(time);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState("");
  const [selectedCommitUrl, setSelectedCommitUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAdjustBox, setShowAdjustBox] = useState(false);
  const [isRefreshingCommits, setIsRefreshingCommits] = useState(false);


  const adjustBoxRef = React.useRef(null);
  let mouseLeaveTimeout = null;

  const buttonRef = React.useRef(null);
  let closeTimeout = React.useRef(null);

  const roundToNearest5 = (timeStr) => {
    const match = timeStr.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (!match) return timeStr;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);

    let totalMinutes = hours * 60 + minutes + (seconds >= 30 ? 1 : 0); // arrondi si >= 30s

    const roundedMinutes = Math.round(totalMinutes / 5) * 5;
    const newHours = Math.floor(roundedMinutes / 60);
    const newMinutes = roundedMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        adjustBoxRef.current &&
        !adjustBoxRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowAdjustBox(false);
      }
    };

    if (showAdjustBox) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(closeTimeout.current);
    };
  }, [showAdjustBox]);

  const openAdjustBox = () => setShowAdjustBox(true);
  const closeAdjustBox = () => setShowAdjustBox(false);

  const adjustTimeBy = (delta) => {
    const match = editedTime.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (!match) return;

    let hours = parseInt(match[1], 10);
    let minutes = parseInt(match[2], 10);
    let seconds = parseInt(match[3], 10);

    let totalMinutes = hours * 60 + minutes + delta;
    if (totalMinutes < 0) totalMinutes = 0;

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    setEditedTime(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`);
  };

  const refreshCommits = async () => {
    setIsRefreshingCommits(true);
    const newCommits = await window.electron.getTodaysCommits();
    setCommits(newCommits);
    setTimeout(() => setIsRefreshingCommits(false), 800); // petite pause pour l’animation
  };

  useEffect(() => {
    const fetchCommits = async () => {
      const newCommits = await window.electron.getTodaysCommits();
      setCommits(newCommits);
    };

    fetchCommits(); // appel initial
    const intervalId = setInterval(fetchCommits, 60000); // toutes les minutes

    return () => clearInterval(intervalId); // nettoyage
  }, []);

  const handleValider = () => {
    if (!selectedFile || !editedTime || !message) {
      alert('Tous les champs doivent être remplis.');
      return;
    }

    const selected = projectList.find(p => p.nomProjet === selectedFile);
    if (!selected) return;

    setIsSubmitting(true); // 🌀 loader ON

    window.electron.ipcRenderer.once('append-to-sheet-success', () => {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${selected.spreadsheetId}`;
      const notification = new Notification('Temps ajouté', {
        body: `🕒 ${editedTime} ajouté à « ${selected.nomProjet} »`,
      });

      notification.onclick = () => {
        window.electron.ipcRenderer.send('open-external-url', sheetUrl);
      };
      setIsSubmitting(false); // 🌀 loader OFF
      if (onSuccess) onSuccess(); // supprime le chrono associé
      onClose(); // ferme la modale
    });

    window.electron.ipcRenderer.send('append-to-sheet', {
      spreadsheetId: selected.spreadsheetId,
      sheetName: selected.sheetName,
      values: [[message, selectedCommitUrl, 'Jimmy', new Date().toLocaleDateString('fr-FR'), editedTime]],
    });
  };

  const handleSelectCommit = (value) => {
    setSelectedCommit(value);

    // Par défaut, réinitialise
    setSelectedCommitUrl("");
    setMessage("");

    // Cherche un numéro d'issue : #123
    const issueMatch = value.match(/#(\d+)/);
    if (issueMatch) {
      const ref = issueMatch[1];
      const issueUrl = `https://tracker.lajungle.fr/issues/${ref}`;
      setSelectedCommitUrl(issueUrl);
    }

    // Si on trouve aussi un titre après "-", on le prend
    const messageMatch = value.match(/-\s*(.*)$/);
    if (messageMatch) {
      setMessage(messageMatch[1]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 w-96 no-drag">
        {/* Bouton ✕ pour fermer */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 text-lg transition-colors ${isSubmitting ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-black'
            }`}
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>

        <div className="mb-3 mt-4 flex gap-4">
          {/* Select avec icône */}
          <ProjectDropdown
            projects={projectList}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />

          {/* Input avec icône */}
          <div className="relative w-full flex items-center">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-9 pr-6 p-2 border border-gray-300 rounded text-black"
              value={editedTime}
              onChange={(e) => setEditedTime(e.target.value)}
            />
            {/* Bouton "Arrondir" */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="relative">
                <button
                  ref={buttonRef}
                  className="p-1 bg-blue-100 hover:bg-blue-200 rounded-full transition"
                  onClick={openAdjustBox}
                  onMouseEnter={() => clearTimeout(closeTimeout.current)}
                  onMouseLeave={() => {
                    closeTimeout.current = setTimeout(() => {
                      closeAdjustBox();
                    }, 1000);
                  }}
                >
                  <CircleDashed className="w-3 h-3 text-blue-700" />
                </button>

                <AnimatePresence>
                  {showAdjustBox && (
                    <motion.div
                      ref={adjustBoxRef}
                      className="absolute right-0 mt-2 z-50 bg-white shadow-xl border rounded-xl p-2 flex gap-2"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                      exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } }}
                      onMouseEnter={() => clearTimeout(closeTimeout.current)}
                      onMouseLeave={() => {
                        closeTimeout.current = setTimeout(() => {
                          closeAdjustBox();
                        }, 1000);
                      }}
                    >
                      <motion.button
                        key="minus"
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                        onClick={() => adjustTimeBy(-5)}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ delay: 0.05 }}
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </motion.button>

                      <motion.button
                        key="plus"
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                        onClick={() => adjustTimeBy(5)}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        <div className="mb-4">
          <textarea
            className="w-full p-2 border border-gray-300 rounded text-black"
            rows={2}
            placeholder="Message personnalisé"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <CommitDropdown
            commits={commits}
            selectedCommit={selectedCommit}
            setSelectedCommit={setSelectedCommit}
            setSelectedCommitUrl={setSelectedCommitUrl}
            setMessage={setMessage}
            refreshCommits={refreshCommits}
            isRefreshing={isRefreshingCommits}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-3 py-1 rounded flex items-center gap-1 transition-all ${isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            <X size={16} /> Annuler
          </button>
          <button
            onClick={handleValider}
            disabled={isSubmitting}
            className={`px-3 py-1 rounded flex items-center gap-2 transition-all ${isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} /> Valider
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default TimerModal;
