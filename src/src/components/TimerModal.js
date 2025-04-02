import React, { useState, useEffect } from 'react';
import { X, Check, FolderIcon, ClockIcon, CheckSquare } from 'lucide-react';
import ProjectDropdown from './ProjectDropdown';
import Logger from 'electron-log';

const TimerModal = ({ onClose, time, onSuccess, projectList, setProjectList }) => {
  const [editedTime, setEditedTime] = useState(time);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState("");
  const [selectedCommitUrl, setSelectedCommitUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.electron.getTodaysCommits().then((commits) => {
      setCommits(commits);
    });

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
    setSelectedCommitUrl("");

    const match = value.match(/^refs\s+#(\d+)\s*-\s*(.*)$/i);
    if (match) {
      const [, ref, message] = match;
      const issueUrl = `https://tracker.lajungle.fr/issues/${ref}`;

      setSelectedCommitUrl(issueUrl); // stocke le lien complet
      setMessage(message);   // remplit le champ texte
    } else {
      setSelectedCommitUrl("");
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
          <div className="relative w-full">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-10 p-2 border border-gray-300 rounded text-black"
              value={editedTime}
              onChange={(e) => setEditedTime(e.target.value)}
            />
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
          <div className="relative w-full">
            <CheckSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              id="git-commits"
              className="w-full pl-10 p-2 border border-gray-300 rounded"
              value={selectedCommit}
              onChange={(e) => handleSelectCommit(e.target.value)}
            >
              <option value="">(aucun commit sélectionné)</option>
              {commits.length > 0 ? (
                commits.map((commit, index) => (
                  <option key={index} value={commit}>
                    {commit}
                  </option>
                ))
              ) : (
                <option disabled>Aucun commit aujourd’hui</option>
              )}
            </select>
          </div>
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
