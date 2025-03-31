import React, { useState, useEffect } from 'react';
import { listGoogleSheets, listSheetTabs, appendToSheet } from '../utils/googleApi';

const TimerModal = ({ onClose, time }) => {
  const [files, setFiles] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [fileId, setFileId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [message, setMessage] = useState('');
  const [manualTime, setManualTime] = useState(time);

  useEffect(() => {
    listGoogleSheets().then(setFiles);
  }, []);

  useEffect(() => {
    if (fileId) listSheetTabs(fileId).then(setSheets);
  }, [fileId]);

  const handleSubmit = () => {
    appendToSheet(fileId, sheetName, [new Date().toISOString(), manualTime, message]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-lg space-y-4">
        <select onChange={e => setFileId(e.target.value)}>
          <option value="">Choisir un fichier</option>
          {files.map(file => (
            <option key={file.id} value={file.id}>{file.name}</option>
          ))}
        </select>
        <select onChange={e => setSheetName(e.target.value)}>
          <option value="">Choisir une feuille</option>
          {sheets.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" className="w-full p-2 border" />
        <input type="text" value={manualTime} onChange={e => setManualTime(e.target.value)} className="w-full p-2 border" />
        <div className="flex justify-between">
          <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Valider</button>
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">Relancer</button>
        </div>
      </div>
    </div>
  );
};

export default TimerModal;
