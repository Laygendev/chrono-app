import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClockIcon, CheckSquare, FolderIcon } from 'lucide-react';

const icons = [
  { Icon: ClockIcon, action: () => console.log('Horloge') },
  { Icon: CheckSquare, action: () => console.log('Valider') },
  { Icon: FolderIcon, action: () => console.log('Projet') },
  { Icon: ClockIcon, action: () => console.log('Encore 1') },
  { Icon: CheckSquare, action: () => console.log('Encore 2') },
  { Icon: FolderIcon, action: () => console.log('Encore 3') },
  { Icon: ClockIcon, action: () => console.log('Encore 4') },
  { Icon: CheckSquare, action: () => console.log('Encore 5') },
];

const StopBox = forwardRef(({ anchorRect, onClose }, ref) => {
  const boxRef = useRef(null);

  useImperativeHandle(ref, () => boxRef.current);

  const [boxHeight, setBoxHeight] = useState(0);

  // Mesure la hauteur de la box après le rendu
  useEffect(() => {
    if (boxRef.current) {
      setBoxHeight(boxRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e) => {
      const domNode = ReactDOM.findDOMNode(boxRef.current);
      if (domNode && !domNode.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  const top = anchorRect.top + window.scrollY;
  const left = anchorRect.left + window.scrollX - 200; // box width ~260px

  // Vérifie si la boîte dépasse le bas de l'écran en utilisant la hauteur réelle
  const bottomPosition = top + boxHeight;
  const shouldPositionTop = bottomPosition > window.innerHeight; // Si ça dépasse la hauteur de la fenêtre

  return (
    <AnimatePresence>
      <motion.div
        ref={boxRef}
        className="fixed z-50 bg-white shadow-xl border rounded-xl p-2 w-[200px] overflow-y-auto"
        style={{
          top: `${shouldPositionTop ? top - boxHeight : top}px`, // Affiche au-dessus si ça dépasse
          left: `${left}px`,
          transform: 'translateY(-50%)',
          WebkitAppRegion: 'no-drag'
        }}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } }}
      >
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 text-lg transition-colors text-gray-500 hover:text-black'
            }`}
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-4 gap-x-4 gap-y-3 w-full mt-6">
          {icons.map(({ Icon, action }, i) => (
            <motion.button
              key={i}
              onClick={action}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: i * 0.02 }}
            >
              <Icon className="w-4 h-4 text-blue-700" />
            </motion.button>
          ))}
        </div>

      </motion.div>
    </AnimatePresence>
  );
});

export default StopBox;
