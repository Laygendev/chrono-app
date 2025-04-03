// 📁 src/App.js (séparation fond draggable / contenu UI pour éviter le bug d'opacity)
import React, { useEffect, useState } from 'react';
import TimerCard from './components/TimerCard';
import './App.css';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import AnimatedBackground from './components/AnimatedBackground';

const COLORS = [
  'bg-pink-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-orange-100',
  'bg-red-100',
  'bg-cyan-100',
  'bg-lime-100',
];

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timers, setTimers] = useState([crypto.randomUUID()]);
  const [activeTimers, setActiveTimers] = useState({});
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [checkingProject, setCheckingProject] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 1 }); // éviter division par 0
  const [projectList, setProjectList] = useState([]);

  const positiveMessages = [
    "Respire… ou alors mange du chocolat, ça marche aussi.",
    "Méditer, c’est comme faire une sieste… mais en prétendant être spirituel.",
    "Mon karma a pris un café ce matin, tout va bien.",
    "Je suis en paix… tant que personne ne me parle avant mon café.",
    "Aujourd’hui, je choisis la paix. Demain, je verrai selon mon niveau de sommeil.",
    "Le calme intérieur, c’est quand ton cerveau ne fait plus de karaoké à 3h du matin.",
    "J’ai lâché prise… surtout sur le ménage.",
    "Souris à la vie, elle est souvent moins sérieuse que toi.",
    "J’avance lentement, mais je ne recule que pour prendre de l’élan (ou trouver du Wi-Fi).",
    "Mon mantra du jour : \"Ce n’est pas grave\".",
    "J’ai trouvé mon équilibre : une main sur un cookie, l’autre sur une tisane.",
    "Zen, mais prêt·e à courir si quelqu’un me pique mon coussin préféré.",
    "Aujourd’hui, je rayonne… surtout de sarcasme, mais c’est déjà ça.",
    "Mon esprit est comme un lac paisible… sauf quand on y jette un caillou nommé \"emails\".",
    "Rester calme, c’est un art. Et moi, je suis encore en brouillon.",
    "Le bonheur est à l’intérieur… sauf s’il y a des crêpes à l’extérieur.",
    "Chaque problème a une solution. Parfois, c’est juste une sieste.",
    "J’ai trouvé l’équilibre : moitié zen, moitié bordélique.",
    "Je suis aligné·e… surtout avec mon canapé.",
    "Aujourd’hui, je suis une bougie parfumée : paisible mais capable de tout brûler si on m’énerve.",
    "Je ne stresse pas… je pratique le cardio intérieur.",
    "J’ai atteint la pleine conscience… en réalisant que j’avais oublié mes clés.",
    "Mon chakra préféré, c’est celui qui m’autorise à faire la sieste.",
    "Respire profondément… mais pas trop, faut pas s’endormir au bureau.",
    "Je suis un·e guerrier·ère de la paix… mais avec des snacks.",
    "Méditer, c’est comme faire un reset sans avoir besoin de redémarrer Windows.",
    "Mon aura est propre, mais ma cuisine un peu moins.",
    "Je suis serein·e… jusqu’à ce que la batterie du téléphone tombe à 1%.",
    "J’accueille le moment présent… sauf s’il sonne à la porte sans prévenir.",
    "Je suis une plante : j’ai besoin de soleil, d’eau, et qu’on me foute la paix.",
    "J’ai transcendé l’agitation… surtout depuis que j’ai désactivé les notifications.",
    "Je cultive le lâcher-prise… surtout sur les tâches ménagères.",
    "Paix, amour et cookies maison.",
    "Je suis centré·e. Bon, pas toujours droit, mais centré·e.",
    "Mon esprit est comme un ciel bleu… parfois perturbé par des nuages en forme de “To-Do list”.",
    "J’ai atteint l’illumination… en retrouvant un vieux billet dans ma poche.",
    "Être zen, c’est ignorer les gens qui mâchent fort.",
    "Je suis à deux respirations profondes d’envoyer tout valser, mais je tiens.",
    "L’univers m’envoie des signes… souvent en majuscules.",
    "La paix intérieure, c’est savoir que tu peux dire “non” sans te justifier (et sans culpabiliser… trop)."
  ];

  const [motivationText, setMotivationText] = useState(positiveMessages[0]);

  useEffect(() => {
    let remainingMessages = [...positiveMessages];
    const usedMessages = [];

    const updateMessage = () => {
      if (remainingMessages.length === 0) {
        remainingMessages = [...usedMessages];
        usedMessages.length = 0;
      }

      const randomIndex = Math.floor(Math.random() * remainingMessages.length);
      const nextMessage = remainingMessages.splice(randomIndex, 1)[0];
      usedMessages.push(nextMessage);
      setMotivationText(nextMessage);
    };

    updateMessage(); // premier message
    const interval = setInterval(updateMessage, 3000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setTimeout(() => setIsLoading(false), 1000);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    // ⚡ Charge l'état global si jamais l'event est passé avant l'ouverture de la modale
    window.electron.ipcRenderer.invoke('get-projects')
      .then((projects) => {
        if (Array.isArray(projects)) {
          setProjectList(projects);
        }
      });

    // ✅ Écoute les mises à jour en live
    const handleStatus = (_, updatedProject) => {
      setProjectList((prevList) => {
        const existingIndex = prevList.findIndex(p => p.nomProjet === updatedProject.nomProjet);
        if (existingIndex !== -1) {
          const updated = [...prevList];
          updated[existingIndex] = updatedProject;
          return updated;
        }
        return [...prevList, updatedProject];
      });
    };

    window.electron.ipcRenderer.on('project-status', handleStatus);

    return () => {
      window.electron.ipcRenderer.removeListener('project-status', handleStatus);
    };
  }, []);

  useEffect(() => {
    const handler = (_, { name, current, total }) => {
      setCheckingProject(name);
      setProgress({ current, total });
    };

    window.electron.ipcRenderer.on("project-checking", handler);

    return () => {
      window.electron.ipcRenderer.removeListener("project-checking", handler);
    };
  }, []);

  useEffect(() => {
    // window.electron.ipcRenderer.on('app-loaded', () => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleReminder = () => {
      new Notification("💡 Pense à relancer le chrono", {
        body: "Tu viens de déverrouiller l’écran.",
      });
    };

    window.electron?.ipcRenderer?.on("notify-unlock-reminder", handleReminder);

    return () => {
      window.electron?.ipcRenderer?.removeListener("notify-unlock-reminder", handleReminder);
    };
  }, []);

  const addTimer = () => {
    const newId = crypto.randomUUID();
    setTimers(prev => [...prev, newId]);
  };

  // Supprimer un chrono par son ID
  const deleteTimer = (id) => {
    setTimers(prev => prev.filter(timer => timer !== id));
    setActiveTimers(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeTimerId === id) {
      setActiveTimerId(null);
    }
  };

  const closeWindow = () => {
    if (window?.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('close-window');
    } else {
      window.close();
    }
  };

  const updateRunningStatus = (id, isRunning) => {
    setActiveTimers(prev => ({ ...prev, [id]: isRunning }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const anyRunning = Object.values(activeTimers).some(Boolean);
      if (anyRunning) {
        new Notification('⏱️ Chrono actif', {
          body: 'Un chrono est en cours.',
        });
      } else {
        new Notification('⛔ Aucun chrono actif', {
          body: 'Attention ! Aucun chrono n’est actuellement en cours.',
        });
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [activeTimers]);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <AnimatedBackground
            key="loading"
            loadingText="Chargement"
            subText={motivationText}
          />
        )}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen relative text-black">
          {/* Zone draggable invisible derrière tout */}
          <div className="absolute inset-0 -z-10 drag overflow-hidden">
            {Object.values(activeTimers).some(Boolean) && <AnimatedBackground />}
          </div>

          {/* Contenu UI non draggable */}
          <div className="relative flex flex-col p-2">
            <div className="absolute top-0 right-0 z-10 p-2">
              <button
                onClick={closeWindow}
                className="text-sm text-gray-600 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <LayoutGroup>
              <div className="flex flex-col gap-1 overflow-auto mt-6">
                <AnimatePresence initial={false}>
                  {timers.length === 0 && (
                    <div className="text-center text-gray-500 italic my-4">
                      Cliquez sur{' '}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 rounded text-sm">
                        <Plus size={14} /> Chrono
                      </span>{' '}
                      pour ajouter un minuteur
                    </div>
                  )}

                  {timers.map((id, index) => {
                    const colorClass = COLORS[index % COLORS.length];

                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                      >
                        <TimerCard
                          id={id}
                          onDelete={deleteTimer}
                          onRunningChange={updateRunningStatus}
                          isActive={activeTimerId === id}
                          onActivate={() => setActiveTimerId(id)}
                          color={colorClass}
                          projectList={projectList}
                          setProjectList={setProjectList}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </LayoutGroup>
            <div className="mt-2 text-center flex justify-end">
              <button
                onClick={addTimer}
                className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded flex justify-end"
              >
                <Plus size={18} /> Chrono
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;