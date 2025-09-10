import React from "react";
import cardBack from "../assets/card-back.png";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Card = ({
  card,
  selected = false,
  isOpponent = false,
  isOpponentCard = false,
  isReorderMode = false,
  onMoveLeft,
  onMoveRight,
  size = 96,
}) => {
  if (card.faceDown) {
    return (
      <div
        className={`rounded-lg shadow-md overflow-hidden ${
          isOpponentCard ? "opacity-80" : ""
        }`}
        style={{
          width: `${size * 0.67}px`,
          height: `${size}px`,
          backgroundColor: "#3c0b1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto", // Center the card
        }}
      >
        <img
          src={cardBack}
          alt="Card Back"
          style={{
            width: "90%",
            height: "90%",
            objectFit: "contain",
            imageRendering: "crisp-edges",
          }}
        />
      </div>
    );
  }

  const suitColors = {
    hearts: "text-red-500",
    diamonds: "text-red-500",
    clubs: "text-gray-800",
    spades: "text-gray-800",
  };

  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const getTextSize = () => {
    if (size < 70) return "text-xs";
    if (size < 80) return "text-sm";
    return "text-base";
  };

  const interactiveClasses = isOpponent
    ? "cursor-not-allowed"
    : "cursor-pointer hover:shadow-lg";

  return (
    <div className="relative flex justify-center">
      <div
        className={`rounded-lg border-2 ${
          card.isJoker
            ? card.jokerType === 'true'
              ? "bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-500"
              : "bg-gradient-to-br from-purple-100 to-purple-200 border-purple-500"
            : "bg-white border-gray-300"
        } ${
          selected
            ? "shadow-yellow-300 shadow-md"
            : ""
        } shadow-md ${interactiveClasses} transform transition-transform ${
          isOpponentCard ? "opacity-90" : ""
        }`}
        style={{
          width: `${size * 0.67}px`,
          height: `${size}px`,
          margin: "0 auto", // Center the card
        }}
      >
        <div className="h-full w-full p-2 flex flex-col justify-center items-center pointer-events-none relative">
          {/* Joker indicator */}
          {card.isJoker && card.jokerType === 'true' && (
            <div className="absolute top-0 right-0 text-xs font-bold">
              <span className="text-yellow-600">★</span>
            </div>
          )}
          
          {/* Centered suit icon and rank */}
          <div
            className={`${getTextSize()} font-bold ${
              card.isJoker 
                ? card.jokerType === 'true'
                  ? "text-yellow-700"
                  : "text-purple-700"
                : suitColors[card.suit]
            } flex flex-col items-center`}
          >
            {card.isJoker && card.rank === 'JOKER' ? (
              <>
                <span className="mb-1 text-2xl">🃏</span>
                {card.jokerType === 'true' && <span className="text-xs">TRUE</span>}
              </>
            ) : (
              <>
                <span className="mb-1">{suitSymbols[card.suit]}</span>
                {card.rank}
              </>
            )}
          </div>

          {/* Bottom right rank and suit (rotated) - COMMENTED OUT */}
          {/* <div
            className={`${getTextSize()} font-bold ${
              suitColors[card.suit]
            } self-end transform rotate-180 flex items-center`}
          >
            {card.rank}
            <span className="ml-1.5">{suitSymbols[card.suit]}</span>
          </div> */}
        </div>
      </div>

      {/* Reorder Buttons */}
      {selected && isReorderMode && !isOpponent && (
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between -mx-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft?.();
            }}
            className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-1 shadow-lg transform transition-transform hover:scale-110"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight?.();
            }}
            className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-1 shadow-lg transform transition-transform hover:scale-110"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Card;
