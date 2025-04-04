import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sections = [
    {
        title: 'Bienvenue dans l’application Chrono',
        text: 'Cette application vous permet de lancer plusieurs minuteurs simultanément et de les relier à des projets Google Sheets. Les données sont aussi automatiquement synchronisées avec le dashboard de LaJungle.'
    },
    {
        title: 'Démarrer un chrono',
        text: 'Cliquez sur le bouton “Chrono +” pour en ajouter un. Cliquez ensuite sur le bouton play pour démarrer un chrono. Un seul chrono peut être actif à la fois, les autres sont mis en pause automatiquement.'
    },
    {
        title: 'Arrêter un chrono',
        text: 'Cliquez brièvement sur le bouton stop pour ouvrir directement la modale de temps avec la catégorie “Maintenance” sélectionnée par défaut. En maintenant le clic environ 300 ms, vous accédez d’abord au choix des catégories.'
    },
    {
        title: 'Catégories',
        text: 'Les catégories vous permettent de classer votre temps par type d’activité (développement, réunion, veille, etc.). Ces catégories sont synchronisées avec celles du dashboard LaJungle. Lorsqu’une catégorie est utilisée, le temps est automatiquement injecté dans les données du dashboard.'
    },
    {
        title: 'Google Sheets',
        text: 'Les temps sont automatiquement envoyés vers un fichier Google Sheets lié à chaque projet. Le commit sélectionné est aussi intégré si présent. Certains projets peuvent être désactivés dans la liste déroulante s’ils ne respectent pas le format attendu (en-têtes manquantes ou incorrectes).'
    },
    {
        title: 'Commits liés à un ticket',
        text: 'En mode “Maintenance”, une liste déroulante affiche tous les commits Git réalisés aujourd’hui contenant une référence du type "refs #12345 - Mon message". Le numéro (ex. 12345) correspond au ticket lié, et le texte après le tiret est automatiquement repris dans le champ de commentaire. Cela permet un gain de temps et une meilleure traçabilité dans les fichiers de maintenance.'
    },
    {
        title: 'Limite journalière de 7h',
        text: 'Lorsque vous atteignez 7 heures de temps comptabilisé dans une journée, un message d’alerte s’affiche et les temps saisis au-delà ne sont plus injectés dans le dashboard de LaJungle.'
    },
    {
        title: 'Configuration des projets',
        text: 'Il n’est pas possible d’ajouter manuellement des projets. Ceux-ci sont configurés automatiquement dans l’application via un système centralisé.'
    }
];

const HelpModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 no-drag">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg"
            >
                <div className="absolute top-2 right-2">
                    <button onClick={onClose} className="text-gray-600 hover:text-black">
                        <X size={20} />
                    </button>
                </div>

                <h2 className="text-xl font-semibold mb-4 text-center">Aide & Mode d’emploi</h2>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {sections.map(({ title, text }) => (
                        <div key={title}>
                            <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
                            <p className="text-sm text-gray-600 leading-snug">{text}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default HelpModal;
