import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiUrl } from "../utils/apiUrl";

function Test() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [newCard, setNewCard] = useState({ rank: '', suit: '', value: 0, isJoker: false });
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [selectedMeldIndex, setSelectedMeldIndex] = useState(null);

  // Fetch game data
  const fetchGame = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("cardgametoken");
      const response = await fetch(`${apiUrl}/api/test-games/game/get/${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status}`);
      }

      const gameData = await response.json();
      setGame(gameData);
    } catch (err) {
      console.error('Error fetching game:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete card from game
  const deleteCard = async (location, playerIndex, cardIndex, meldIndex = null) => {
    try {
      const token = localStorage.getItem("cardgametoken");
      const response = await fetch(`${apiUrl}/api/test-games/delete-card/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          location, // 'hand', 'meld', 'deck', 'discard'
          playerIndex,
          cardIndex,
          meldIndex
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete card');
      }

      await fetchGame(); // Refresh game data
      alert('Card deleted successfully!');
    } catch (err) {
      console.error('Error deleting card:', err);
      setError(err.message);
    }
  };

  // Add new card to game
  const addCard = async () => {
    try {
      // Validate card data
      if (!newCard.rank || !newCard.suit) {
        alert('Please select rank and suit before adding a card');
        return;
      }

      const token = localStorage.getItem("cardgametoken");
      const response = await fetch(`${apiUrl}/api/test-games/add-card/${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: selectedLocation,
          playerIndex: selectedPlayerIndex,
          meldIndex: selectedMeldIndex,
          card: {
            rank: newCard.rank,
            suit: newCard.suit,
            value: newCard.value || getRankValue(newCard.rank),
            isJoker: newCard.isJoker,
            jokerType: newCard.isJoker ? 'false' : null
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add card');
      }

      await fetchGame(); // Refresh game data
      closeAddCardModal();
      alert('Card added successfully!');
    } catch (err) {
      console.error('Error adding card:', err);
      setError(err.message);
    }
  };

  // Card data constants
  const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'JOKER'];
  const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades', 'red', 'black'];

  // Helper function to get rank value
  const getRankValue = (rank) => {
    const rankValues = {
      A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
      J: 11, Q: 12, K: 13, JOKER: 0
    };
    return rankValues[rank] || 0;
  };

  // Open add card modal
  const openAddCardModal = (location, playerIndex = null, meldIndex = null) => {
    setSelectedLocation(location);
    setSelectedPlayerIndex(playerIndex);
    setSelectedMeldIndex(meldIndex);
    setNewCard({ rank: '', suit: '', value: 0, isJoker: false });
    setShowAddCardModal(true);
  };

  // Close add card modal
  const closeAddCardModal = () => {
    setShowAddCardModal(false);
    setSelectedLocation(null);
    setSelectedPlayerIndex(null);
    setSelectedMeldIndex(null);
    setNewCard({ rank: '', suit: '', value: 0, isJoker: false });
  };

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
        <button 
          onClick={fetchGame}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Game Cards - ID: {gameId}</h1>
        
        {/* Players Hands */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Player Hands</h2>
          {game.players?.map((player, playerIndex) => (
            <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium mb-3">Player {playerIndex + 1} Hand ({player.hand?.length || 0} cards)</h3>
              <div className="flex flex-wrap gap-2">
                {player.hand?.map((card, cardIndex) => (
                  <div key={cardIndex} className="relative group">
                    <div className="bg-white text-black p-2 rounded text-sm font-bold min-w-[40px] text-center cursor-pointer hover:bg-gray-200">
                      {card.isJoker ? 'JOKER' : `${card.rank}${card.suit?.charAt(0)?.toUpperCase()}`}
                    </div>
                    <button
                      onClick={() => deleteCard('hand', playerIndex, cardIndex)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                      title="Delete card"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => openAddCardModal('hand', playerIndex)}
                  className="bg-green-500 text-white p-2 rounded text-sm font-bold min-w-[40px] text-center hover:bg-green-600"
                  title="Add card to hand"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Players Melds */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Player Melds</h2>
          {game.players?.map((player, playerIndex) => (
            <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium mb-3">Player {playerIndex + 1} Melds ({player.melds?.length || 0} melds)</h3>
              {player.melds?.map((meld, meldIndex) => (
                <div key={meldIndex} className="bg-gray-600 rounded p-2 mb-2">
                  <div className="text-sm font-medium mb-1">
                    {meld.type} ({meld.cards?.length || 0} cards) - {meld.isVisible ? 'Visible' : 'Hidden'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {meld.cards?.map((card, cardIndex) => (
                      <div key={cardIndex} className="relative group">
                        <div className="bg-white text-black p-1 rounded text-xs font-bold min-w-[30px] text-center cursor-pointer hover:bg-gray-200">
                          {card.isJoker ? 'J' : `${card.rank}${card.suit?.charAt(0)?.toUpperCase()}`}
                        </div>
                        <button
                          onClick={() => deleteCard('meld', playerIndex, cardIndex, meldIndex)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                          title="Delete card"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => openAddCardModal('meld', playerIndex, meldIndex)}
                      className="bg-green-500 text-white p-1 rounded text-xs font-bold min-w-[30px] text-center hover:bg-green-600"
                      title="Add card to meld"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Deck and Discard */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Deck & Discard</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Deck ({game.deck?.length || 0} cards)</h3>
              <div className="flex flex-wrap gap-1">
                {game.deck?.slice(0, 20).map((card, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-white text-black p-1 rounded text-xs font-bold min-w-[30px] text-center cursor-pointer hover:bg-gray-200">
                      {card.isJoker ? 'J' : `${card.rank}${card.suit?.charAt(0)?.toUpperCase()}`}
                    </div>
                    <button
                      onClick={() => deleteCard('deck', null, index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                      title="Delete card"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {game.deck?.length > 20 && <div className="text-gray-400 text-xs">...{game.deck.length - 20} more</div>}
                <button
                  onClick={() => openAddCardModal('deck', null)}
                  className="bg-green-500 text-white p-1 rounded text-xs font-bold min-w-[30px] text-center hover:bg-green-600"
                  title="Add card to deck"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Discard Pile ({game.discardPile?.length || 0} cards)</h3>
              <div className="flex flex-wrap gap-1">
                {game.discardPile?.slice(-10).map((card, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-white text-black p-1 rounded text-xs font-bold min-w-[30px] text-center cursor-pointer hover:bg-gray-200">
                      {card.isJoker ? 'J' : `${card.rank}${card.suit?.charAt(0)?.toUpperCase()}`}
                    </div>
                    <button
                      onClick={() => deleteCard('discard', null, index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                      title="Delete card"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => openAddCardModal('discard', null)}
                  className="bg-green-500 text-white p-1 rounded text-xs font-bold min-w-[30px] text-center hover:bg-green-600"
                  title="Add card to discard pile"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Base Card and True Jokers */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Base Card & True Jokers</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Base Card</h3>
              {game.baseCard ? (
                <div className="relative group">
                  <div className="bg-white text-black p-3 rounded text-lg font-bold min-w-[60px] text-center inline-block cursor-pointer hover:bg-gray-200">
                    {game.baseCard.isJoker ? 'JOKER' : `${game.baseCard.rank}${game.baseCard.suit?.charAt(0)?.toUpperCase()}`}
                  </div>
                  <button
                    onClick={() => deleteCard('base', null, 0)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                    title="Delete base card"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-gray-400">No base card</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">True Jokers ({game.trueJokers?.length || 0})</h3>
              <div className="flex flex-wrap gap-1">
                {game.trueJokers?.map((joker, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-yellow-200 text-black p-1 rounded text-xs font-bold min-w-[30px] text-center cursor-pointer hover:bg-yellow-300">
                      {joker.rank} {joker.suit?.charAt(0)?.toUpperCase()}
                    </div>
                    <button
                      onClick={() => deleteCard('trueJokers', null, index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
                      title="Delete true joker"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* Refresh Button */}
        <div className="flex gap-4">
          <button
            onClick={fetchGame}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Game
          </button>
        </div>

        {/* Add Card Modal */}
        {showAddCardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold mb-4">Add New Card</h2>
              
              <div className="space-y-4">
                {/* Location Info */}
                <div className="p-3 bg-blue-900 rounded text-sm">
                  <strong>Adding to:</strong> {
                    selectedLocation === 'hand' ? `Player ${selectedPlayerIndex + 1} Hand` :
                    selectedLocation === 'meld' ? `Player ${selectedPlayerIndex + 1} Meld ${selectedMeldIndex + 1}` :
                    selectedLocation === 'deck' ? 'Deck' :
                    selectedLocation === 'discard' ? 'Discard Pile' :
                    selectedLocation === 'base' ? 'Base Card' :
                    selectedLocation === 'trueJokers' ? 'True Jokers' :
                    selectedLocation
                  }
                </div>

                {/* Rank Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Rank:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CARD_RANKS.map(rank => (
                      <button
                        key={rank}
                        onClick={() => {
                          setNewCard(prev => ({ 
                            ...prev, 
                            rank, 
                            isJoker: rank === 'JOKER',
                            value: getRankValue(rank)
                          }));
                        }}
                        className={`p-2 rounded text-sm font-bold ${
                          newCard.rank === rank 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {rank}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suit Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Suit:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CARD_SUITS.map(suit => (
                      <button
                        key={suit}
                        onClick={() => setNewCard(prev => ({ ...prev, suit }))}
                        className={`p-2 rounded text-sm font-bold capitalize ${
                          newCard.suit === suit 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {suit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Joker Checkbox */}
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCard.isJoker}
                      onChange={(e) => setNewCard(prev => ({ ...prev, isJoker: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Is Joker</span>
                  </label>
                </div>

                {/* Card Preview */}
                <div className="p-3 bg-gray-700 rounded text-center">
                  <div className="text-lg font-bold">
                    {newCard.rank && newCard.suit ? 
                      `${newCard.rank} of ${newCard.suit}${newCard.isJoker ? ' (Joker)' : ''}` : 
                      'Select rank and suit'
                    }
                  </div>
                  {newCard.rank && newCard.suit && (
                    <div className="text-sm text-gray-400 mt-1">
                      Value: {newCard.value || getRankValue(newCard.rank)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={addCard}
                    disabled={!newCard.rank || !newCard.suit}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Card
                  </button>
                  <button
                    onClick={closeAddCardModal}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raw Game Data */}
        <details className="mt-6">
          <summary className="cursor-pointer text-lg font-medium mb-2">Raw Game Data</summary>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(game, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default Test;
