import React, { useState, useEffect } from 'react';
import { X, Check, FolderIcon, ClockIcon } from 'lucide-react';

const TimerModal = ({ onClose, time, onSuccess }) => {
  const [editedTime, setEditedTime] = useState(time);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [projectList, setProjectList] = useState([]);
  const [commits, setCommits] = useState([]);

  useEffect(() => {
    window.electron.getTodaysCommits().then((commits) => {
      setCommits(commits);
    });

    fetch('./projet.json')
      .then((res) => res.json())
      .then((data) => setProjectList(data))
      .catch((err) => console.error('Erreur de chargement projets.json', err));
  }, []);

  const handleValider = () => {
    if (!selectedFile || !editedTime || !message) {
      alert('Tous les champs doivent être remplis.');
      return;
    }

    const selected = projectList.find(p => p.nomProjet === selectedFile);
    if (!selected) return;

    window.electron.ipcRenderer.once('append-to-sheet-success', () => {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${selected.spreadsheetId}`;
      const notification = new Notification('Temps ajouté', {
        body: `🕒 ${editedTime} ajouté à « ${selected.nomProjet} »`,
      });

      notification.onclick = () => {
        window.electron.ipcRenderer.send('open-external-url', sheetUrl);
      };
      if (onSuccess) onSuccess(); // supprime le chrono associé
      onClose(); // ferme la modale
    });

    window.electron.ipcRenderer.send('append-to-sheet', {
      spreadsheetId: selected.spreadsheetId,
      sheetName: selected.sheetName,
      values: [[message, '', 'Jimmy', new Date().toLocaleDateString('fr-FR'), editedTime]],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 w-96 no-drag">
        {/* Bouton ✕ pour fermer */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-lg"
        >
          <X size={20} />
        </button>

        <div className="mb-3 mt-4 flex gap-4">
          {/* Select avec icône */}
          <div className="relative w-full">
            <FolderIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <select
              className="w-full pl-10 p-2 border border-gray-300 rounded"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              <option value="">(aucun)</option>
              {projectList.map((project, index) => (
                <option key={index} value={project.nomProjet}>
                  {project.nomProjet}
                </option>
              ))}
            </select>
          </div>

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
          <label htmlFor="git-commits">Commits du jour :</label>
          <select id="git-commits" className="p-2 border rounded">
            {commits.length > 0 ? (
              commits.map((commit, i) => (
                <option key={i} value={commit}>
                  {commit}
                </option>
              ))
            ) : (
              <option disabled>Aucun commit aujourd’hui</option>
            )}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-1"
          >
            <X size={16} /> Annuler
          </button>
          <button
            onClick={handleValider}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Check size={16} /> Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerModal;
