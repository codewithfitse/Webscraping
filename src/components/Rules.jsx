import { FiX } from "react-icons/fi"

const Rules = ({ isOpen, onClose, playerDeadwood }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl p-6 max-w-md w-full mx-4 relative border border-white/10 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-full transition-colors duration-200"
        >
          <FiX className="h-5 w-5 text-white/70" />
        </button>
        <div className="text-white">
          <h2 className="text-xl font-bold mb-4">Conquer Rules</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">Game Objective</h3>
              <ul className="list-disc list-inside space-y-2 text-white/90"> 
                <li>Conquer territories by placing your cards strategically on the game board</li>
                <li>Each card represents a unit that can attack or defend territories</li>
                <li>To win, you must control the majority of territories on the board</li>
                <li>Current territories under your control: {playerDeadwood}</li>
                <li>Use strategy to outmaneuver your opponent and expand your empire</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">How to Play</h3>
              <ul className="list-disc list-inside space-y-2 text-white/90">
                <li>Place cards on empty territories to claim them</li>
                <li>Attack adjacent enemy territories with higher card values</li>
                <li>Defend your territories by placing defensive cards</li>
                <li>Special cards have unique abilities - use them wisely</li>
                <li>Plan your moves carefully - each decision matters!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules; 