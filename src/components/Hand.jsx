import React, { useState, useRef, useEffect } from "react";
import Card from "./Card";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const Hand = ({
  cards,
  melds,
  onCardSelect,
  selectedIndex,
  onReorder,
  onDragStart,
  onDragEnd,
  isOpponent = false,
  overlap = 30,
  cardSize = 64,
  selectedCardsForMeld = [],
  storedMeldCardIndices = [],
}) => {
  const [dragStartX, setDragStartX] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [cardWidth, setCardWidth] = useState(cardSize);
  const [cardOverlap, setCardOverlap] = useState(overlap);
  const cardRefs = useRef([]);

  // Responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (isOpponent) {
        // Smaller overlap for opponent cards
      if (width < 380) {
          setCardWidth(cardSize * 0.625);
        setCardOverlap(18);
      } else if (width < 640) {
          setCardWidth(cardSize * 0.687);
        setCardOverlap(20);
      } else if (width < 768) {
          setCardWidth(cardSize * 0.75);
        setCardOverlap(22);
        } else {
          setCardWidth(cardSize);
          setCardOverlap(24);
        }
      } else {
        // Larger overlap for player cards
        if (width < 380) {
          setCardWidth(cardSize * 0.5);  // Even smaller for very small screens
          setCardOverlap(20);
        } else if (width < 640) {
          setCardWidth(cardSize * 0.6);  // Smaller for mobile
          setCardOverlap(25);
        } else if (width < 768) {
          setCardWidth(cardSize * 0.7);  // Medium size for tablets
          setCardOverlap(28);
        } else {
          setCardWidth(cardSize * 0.8);  // Slightly reduced for desktop
          setCardOverlap(30);
        }
      }
    };

    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cardSize, isOpponent]); // Add isOpponent to dependencies

  // Helper function to check if a card is part of a meld
  const isCardInMeld = (card) => {
    if (!melds) return false;
    return melds.some((meld) =>
      meld.cards.some(
        (meldCard) => meldCard.rank === card.rank && meldCard.suit === card.suit
      )
    );
  };

  // Helper function to check if a card is part of stored melds
  const isCardInStoredMeld = (index) => {
    return false; // Cards in stored melds are now filtered out before reaching this component
  };

  // Helper function to check if a card is selected for meld
  const isCardSelectedForMeld = (index) => {
    return selectedCardsForMeld.includes(index);
  };

  // Handle card click - universal selection
  const handleCardClick = (index) => {
    // If it's opponent's hand, do nothing
    if (isOpponent) return;
    
    // Always use the card select handler (which now handles universal selection)
    onCardSelect(index);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) {
      onDragEnd();
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex === toIndex) {
      onDragEnd();
      return;
    }

    onReorder(fromIndex, toIndex);
    onDragEnd();
  };

  const handleTouchStart = (e, index) => {
    if (isOpponent) return;
    setDragStartX(e.touches[0].clientX);
    setDraggedIndex(index);
    onDragStart();
  };

  const handleTouchMove = (e) => {
    if (dragStartX === null || draggedIndex === null || isOpponent) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartX;

    // Calculate potential new index based on drag distance
    const newIndex = draggedIndex + Math.round(diff / cardWidth);

    if (newIndex >= 0 && newIndex < cards.length && newIndex !== draggedIndex) {
      onReorder(draggedIndex, newIndex);
      setDraggedIndex(newIndex);
      setDragStartX(currentX);
    }
  };

  const handleTouchEnd = () => {
    if (isOpponent) return;
    setDragStartX(null);
    setDraggedIndex(null);
    onDragEnd();
  };

  // Calculate total width to center properly
  const totalWidth =
    cards.length > 0 ? (cards.length - 1) * cardOverlap + cardWidth : 0;

  // Calculate the arc parameters
  const getCardStyle = (index) => {
    const totalCards = cards.length;
    const arcAngleRange = 20; // Total angle range for the arc
    const baseAngle = -arcAngleRange / 2;
    const angleIncrement = arcAngleRange / (totalCards - 1 || 1);
    const currentAngle = baseAngle + angleIncrement * index;

    // Calculate vertical offset for the arc effect
    const verticalOffset = Math.abs(currentAngle) * 0.5;

    return {
      transform: `rotate(${currentAngle}deg) translateY(${verticalOffset}px)`,
      transformOrigin: "bottom center",
    };
  };

  // Function to determine grid columns based on screen width
  const getGridColumns = () => {
    const width = window.innerWidth;
    return width < 640 ? 4 : 5;
  };

  // Render different layouts for opponent and player
  if (isOpponent) {
    return (
      <DragDropContext onDragStart={onDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="cards" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex justify-center items-center relative w-full"
              style={{
                minHeight: `${cardWidth * 1.8}px`,
                width: "100%",
                maxWidth: "100vw",
                overflow: "visible",
                perspective: "1000px",
              }}
            >
              <div
                className="relative mx-auto flex justify-center"
                style={{
                  width: `${totalWidth}px`,
                  height: `${cardWidth * 1.5}px`,
                  maxWidth: "100%",
                  margin: "0 auto",
                  position: "relative",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {cards.map((card, index) => (
                  <Draggable
                    key={`${card.rank}${card.suit}`}
                    draggableId={`${card.rank}${card.suit}`}
                    index={index}
                    isDragDisabled={true}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={(el) => {
                          provided.innerRef(el);
                          cardRefs.current[index] = el;
                        }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="absolute transition-all duration-200 ease-in-out"
                        style={{
                          left: `${index * cardOverlap}px`,
                          zIndex: snapshot.isDragging ? 100 : index,
                          width: `${cardWidth}px`,
                          ...getCardStyle(index),
                          ...provided.draggableProps.style,
                        }}
                      >
                        <Card
                          card={card}
                          selected={selectedIndex === index}
                          isOpponent={true}
                          size={cardWidth}
                          isOpponentCard={true}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  // Player's hand with grid layout (matching the image)
  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="cards" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="w-full px-2"
          >
            <div 
              className="grid gap-2 justify-center max-w-full"
              style={{
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gridAutoRows: 'min-content',
              }}
            >
              {cards.map((card, index) => (
                <Draggable
                  key={`${card.rank}${card.suit}`}
                  draggableId={`${card.rank}${card.suit}`}
                  index={index}
                  isDragDisabled={false}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={(el) => {
                        provided.innerRef(el);
                        cardRefs.current[index] = el;
                      }}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="transition-all duration-200 ease-in-out"
                      style={{
                        zIndex: snapshot.isDragging ? 100 : selectedIndex === index ? 99 : index,
                        ...provided.draggableProps.style,
                      }}
                    >
                      <div
                        onClick={() => handleCardClick(index)}
                        className={`transform transition-all duration-200 cursor-pointer ${
                          isCardSelectedForMeld(index) 
                            ? selectedCardsForMeld.length === 1
                              ? "scale-105 -translate-y-2 ring-2 ring-red-400 ring-opacity-70 bg-red-400 bg-opacity-20 rounded-lg"
                              : "scale-105 -translate-y-1 ring-2 ring-blue-400 ring-opacity-70 bg-blue-400 bg-opacity-20 rounded-lg"
                            : ""
                        } ${
                          isCardInMeld(card)
                            ? "rounded-lg ring-2 ring-green-400 ring-opacity-50 bg-green-400 bg-opacity-10"
                            : ""
                        } ${
                          !isCardSelectedForMeld(index)
                            ? selectedCardsForMeld.length === 0 || selectedCardsForMeld.length === 1
                              ? "hover:ring-2 hover:ring-red-300 hover:ring-opacity-50 hover:bg-red-300 hover:bg-opacity-10 rounded-lg"
                              : "hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50 hover:bg-blue-300 hover:bg-opacity-10 rounded-lg"
                            : ""
                        }`}
                      >
                        <Card
                          card={card}
                          selected={selectedIndex === index}
                          size={cardWidth}
                          isOpponent={false}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Hand;
