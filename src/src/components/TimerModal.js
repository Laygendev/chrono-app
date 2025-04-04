import React, { useState, useEffect, useContext } from 'react';
import {
  X, Check, FolderIcon, ClockIcon, CheckSquare, Plus, Minus, CircleDashed,
  ArrowLeft,
  GlobeIcon,
  MapPin,
  Search,
  Users,
  FileText,
  PenTool,
  Settings,
  Briefcase,
  Eye,
  ListChecks,
  Layout,
  FileCode2,
  Paintbrush2
} from 'lucide-react';
import ProjectDropdown from './ProjectDropdown';
import Logger from 'electron-log';
import { motion, AnimatePresence } from 'framer-motion';
import CommitDropdown from './CommitDropdown';
import { UserContext } from '../contexts/UserContext';

// Convertit une durée "HH:mm:ss" en millisecondes
const parseDuration = (timeStr) => {
  const [h, m, s] = timeStr.split(':').map(Number);
  return ((h * 60 + m) * 60 + s) * 1000;
};

// Convertit des millisecondes en format "HH:mm:ss"
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};


function useTooltip() {
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  const showTooltip = (text, x, y) => {
    setTooltip({ visible: true, text, x, y });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const renderTooltip = () =>
    tooltip.visible && (
      <div
        className="fixed z-[9999] px-2 py-1 text-xs bg-black text-white rounded pointer-events-none transition-opacity duration-100"
        style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}
      >
        {tooltip.text}
      </div>
    );

  return { showTooltip, hideTooltip, renderTooltip };
}

const TimerModal = ({ onClose, time, onSuccess, projectList, setProjectList, projectListTMA, setProjectListTMA, forcedStep, forcedCategory }) => {
  const { showTooltip, hideTooltip, renderTooltip } = useTooltip();

  const [editedTime, setEditedTime] = useState(time);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState("");
  const [selectedCommitUrl, setSelectedCommitUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAdjustBox, setShowAdjustBox] = useState(false);
  const [isRefreshingCommits, setIsRefreshingCommits] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const adjustBoxRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const closeTimeout = React.useRef(null);

  const user = useContext(UserContext);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = user?.token;
        const res = await fetch('https://api.lajungle.net/task/types', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        console.log(data);

        const icons = [
          Settings, FileCode2, FolderIcon, Briefcase, Layout, Paintbrush2,
          Paintbrush2, ListChecks, GlobeIcon, Users, Users, MapPin,
          CheckSquare, Eye, Search, FileText
        ];

        const colors = [
          ['gray', 100], ['blue', 100], ['purple', 100], ['yellow', 100],
          ['orange', 100], ['pink', 100], ['pink', 50], ['green', 100],
          ['emerald', 100], ['indigo', 100], ['cyan', 100], ['red', 100],
          ['lime', 100], ['fuchsia', 100], ['amber', 100], ['sky', 100]
        ];

        const withStyle = data.map((cat, i) => {
          const [color, shade] = colors[i % colors.length];
          return {
            id: cat.id, // <-- important
            name: cat.name, // <-- important
            label: cat.name, // pour affichage
            Icon: icons[i % icons.length],
            slug: cat.name.toLowerCase().replace(/ /g, '-').replace(/'/g, '').replace(/\//g, '-'),
            bg: `bg-${color}-${shade}`,
            hb: `hover:bg-${color}-${Math.min(shade + 100, 900)}`
          };
        });

        setCategories(withStyle);
      } catch (err) {
        console.error('Erreur chargement catégories :', err);
      }
    };

    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (forcedStep) setStep(forcedStep);
    if (forcedCategory) setSelectedCategory(forcedCategory);
  }, []);

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

  const roundToNearest5 = (timeStr) => {
    const match = timeStr.match(/^\d+:(\d{2}):(\d{2})$/);
    if (!match) return timeStr;
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
    const rounded = Math.round(totalMinutes / 5) * 5;
    return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}:00`;
  };

  const adjustTimeBy = (delta) => {
    const [h, m, s] = editedTime.split(':').map(Number);
    let total = h * 60 + m + delta;
    if (total < 0) total = 0;
    setEditedTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`);
  };

  const openAdjustBox = () => setShowAdjustBox(true);
  const closeAdjustBox = () => setShowAdjustBox(false);

  const refreshCommits = async () => {
    setIsRefreshingCommits(true);
    const newCommits = await window.electron.getTodaysCommits();
    setCommits(newCommits);
    setTimeout(() => setIsRefreshingCommits(false), 800);
  };

  useEffect(() => {
    const fetch = async () => {
      const data = await window.electron.getTodaysCommits();
      setCommits(data);
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleValider = async () => {
    if (!selectedFile || !editedTime) return alert('Tous les champs doivent être remplis.');
    let selected;
    if (selectedCategory === 'Maintenance') {
      if (!message) {
        return alert('Tous les champs doivent être remplis.');
      }

      selected = projectListTMA.find(p => p.name === selectedFile);
    } else {
      selected = projectList.find(p => p.name === selectedFile);
    }

    if (!selected) return;

    setIsSubmitting(true);

    if (selectedCategory === 'Maintenance') {
      window.electron.ipcRenderer.once('append-to-sheet-success', () => {
        const url = `https://docs.google.com/spreadsheets/d/${selected.spreadsheetId}`;
        new Notification('Temps ajouté dans le dashboard et dans le fichier de maintenance', { body: `🕒 ${editedTime} ajouté à « ${selected.name} »` })
          .onclick = () => window.electron.ipcRenderer.send('open-external-url', url);
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
        onClose();
      });

      const firstname = user?.firstname;

      window.electron.ipcRenderer.send('append-to-sheet', {
        spreadsheetId: selected.spreadsheetId,
        sheetName: selected.sheetName,
        values: [[message, selectedCommitUrl, firstname, new Date().toLocaleDateString('fr-FR'), editedTime]]
      });
    }

    const token = user?.token;
    if (!token) return;

    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.lajungle.net/task/mine/${today}`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    if (!res.ok) throw new Error('Échec de récupération des tâches');
    const tasks = await res.json();

    // Recherche la task qui correspond project_id et task_id. Permet de faire la somme de la duration de celle-ci avec editedTime pour accumuler stp.
    const existingTask = tasks.find(task => {
      const match = task.project_id === selected.id && task.type_id === categories.find(c => c.name === selectedCategory)?.id;
      if (match) {
        console.log('Task correspondante trouvée :', task);
      }
      return match;
    });

    let tmpEditedTime = editedTime;

    if (existingTask) {
      const current = parseDuration(existingTask.duration);
      const addition = parseDuration(editedTime);
      const total = current + addition;
      tmpEditedTime = formatDuration(total);
    }
    const data = JSON.stringify({
      date: today,
      project_id: selected.id, // côté JS, `idApi` = ID projet
      task_id: categories.find(c => c.name === selectedCategory)?.id, // à adapter selon ton backend
      duration: tmpEditedTime
    });

    const userResponse = await fetch('https://api.lajungle.net/task/updateOrCreate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: data,
    });

    if (!userResponse.ok) {
      alert('Erreur lors de l\'ajout du temps');
      setIsSubmitting(false);
      return;
    }

    // Check if is valid JSON
    try {
      await userResponse.json();
    } catch (err) {
      alert('Erreur lors de l\'ajout du temps');
      setIsSubmitting(false);
      return;
    }

    if (selectedCategory !== 'Maintenance') {
      new Notification('Temps ajouté dans le dashboard', { body: `🕒 ${editedTime} ajouté à « ${selected.name} »` })
    }
    setIsSubmitting(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleSelectCommit = (val) => {
    setSelectedCommit(val);
    setSelectedCommitUrl("");
    setMessage("");
    const match = val.match(/#(\d+)/);
    if (match) setSelectedCommitUrl(`https://tracker.lajungle.fr/issues/${match[1]}`);
    const msg = val.match(/-\s*(.*)$/);
    if (msg) setMessage(msg[1]);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        layout
        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
        className="relative bg-white rounded-lg shadow-lg p-2 w-96 no-drag"
      >


        <div className="flex items-center gap-1 text-gray-500">
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="hover:bg-gray-100 rounded-full transition"
                title="Changer de catégorie"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {selectedCategory && (() => {
                const cat = categories.find(c => c.name === selectedCategory);
                return cat?.Icon ? <cat.Icon className="w-4 h-4 rounded-full" title={cat.name} /> : null;
              })()}
            </>
          )}

          {selectedCategory && step === 2 && (() => {
            const cat = categories.find(c => c.name === selectedCategory);
            return cat ? <h2 className="font-medium text-center">{cat.name}</h2> : null;
          })()}

          {step === 1 && <h2 className="font-medium text-center">Catégorie</h2>}

          <div className="ml-auto items-center flex">
            <button
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {step === 1 && (
          <motion.div layout>
            <div className="flex flex-col items-center mt-2 justify-center">
              <div className="grid grid-cols-3 gap-3 mb-2 overflow-y-auto max-h-52 px-1">
                {categories.map(({ name, Icon, bg, hb }, i) => (
                  <motion.div
                    key={name}
                    className="flex flex-col items-center justify-start"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory(name);
                        setStep(2);
                      }}
                      className={`w-14 h-14 ${bg} rounded-full flex items-center justify-center shadow-sm transition ${hb}`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-gray-700 mt-1 text-center leading-tight max-w-[80px] truncate">
                      {name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div layout>
            <div className="mb-3 mt-4 flex gap-4">
              <ProjectDropdown
                projects={selectedCategory === 'Maintenance' ? projectListTMA : projectList}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
              />
              <div className="relative w-full flex items-center">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-9 pr-6 p-2 border border-gray-300 rounded text-black"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                />
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
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </motion.button>
                          <motion.button
                            key="plus"
                            className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full"
                            onClick={() => adjustTimeBy(5)}
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

            {selectedCategory === 'Maintenance' && (
              <>
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
                    onSelectCommit={handleSelectCommit}
                    setSelectedCommit={setSelectedCommit}
                    setSelectedCommitUrl={setSelectedCommitUrl}
                    setMessage={setMessage}
                    onRefreshCommits={refreshCommits}
                    isRefreshing={isRefreshingCommits}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-3 py-1 rounded flex items-center gap-1 transition-all ${isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                <X size={16} /> Annuler
              </button>
              <button
                onClick={handleValider}
                disabled={isSubmitting}
                className={`px-3 py-1 rounded flex items-center gap-2 transition-all ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
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
          </motion.div>
        )}
      </motion.div>
      {renderTooltip()}
    </div >
  );
};

export default TimerModal;