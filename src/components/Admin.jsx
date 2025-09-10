import React, { useEffect, useState } from 'react';
import { FaSpinner, FaCrown, FaDice, FaUser, FaCoins, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { apiUrl } from '../utils/apiUrl';
import Card from './Card';

function Admin() {
    const [games, setGames] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalGames, setTotalGames] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('playing');
    const [gameIdQuery, setGameIdQuery] = useState('');
    const [debounceTimer, setDebounceTimer] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const debounceSearch = (value) => {
        clearTimeout(debounceTimer);
        const newTimer = setTimeout(() => {
            setGameIdQuery(value);
            setCurrentPage(1);
        }, 1000);
        setDebounceTimer(newTimer);
    };

    const fetchGames = async () => {
        try {
            setIsLoading(true);
            const url = new URL(`${apiUrl}/api/admin/games/all`);
            url.searchParams.append('page', currentPage);
            url.searchParams.append('limit', 20);
            url.searchParams.append('status', selectedStatus);
            url.searchParams.append('gameIdSearch', gameIdQuery);

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setGames(data.data.games);
                setTotalPages(data.data.totalPages);
                setTotalGames(data.data.totalGames);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [currentPage, selectedStatus, gameIdQuery]);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = 4;
            }

            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }

            if (start > 2) {
                pageNumbers.push('...');
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (end < totalPages - 1) {
                pageNumbers.push('...');
            }

            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    const handleGameClick = async (gameId) => {
        try {
            setIsLoadingDetails(true);
            const response = await fetch(`${apiUrl}/api/admin/games/${gameId}/details`);
            const data = await response.json();

            if (data.success) {
                setSelectedGame(data.data);
            }
        } catch (error) {
            console.error('Error fetching game details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <div className="flex-1 p-2 sm:p-4 bg-gray-50">
                <div className="p-2 sm:p-4 bg-gray-50 min-h-screen">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4 flex items-center gap-2">
                        <FaDice className="text-blue-600" /> Conquer Games ({totalGames})
                    </h1>

                    <div className="flex flex-col sm:flex-row gap-2 mb-2 sm:mb-4">
                        <input
                            type="text"
                            placeholder="Search by Game ID..."
                            defaultValue={gameIdQuery}
                            onChange={(e) => debounceSearch(e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-4">
                        {['playing', 'waiting', 'completed', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setCurrentPage(1);
                                    setSelectedStatus(status);
                                }}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg capitalize text-xs sm:text-sm ${selectedStatus === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <FaSpinner className="animate-spin text-3xl text-blue-600" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 sm:gap-3">
                            {games.map((game) => (
                                <div
                                    key={game.gameId}
                                    className="bg-white rounded-lg shadow p-2 sm:p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                    onClick={() => handleGameClick(game.gameId)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] sm:text-xs font-mono text-gray-600">#{game.gameId}</span>
                                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${game.gameType === 'private'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {game.gameType}
                                        </span>
                                    </div>

                                    <div className="mb-2">
                                        <div className="text-[10px] sm:text-xs text-gray-500 mb-1">Players:</div>
                                        {game.players.map((player) => (
                                            <div
                                                key={player.userId}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${game.currentPlayer === player.playerId ? 'text-orange-600' : 'text-gray-600'
                                                    }`}
                                            >
                                                <FaUser className={`text-xs sm:text-sm ${game.currentPlayer === player.playerId ? 'text-orange-500' : 'text-gray-400'}`} />
                                                <span className="truncate">{player.username}</span>
                                                <span className="text-[8px] sm:text-[10px] font-mono text-gray-400">({player.userId})</span>
                                                {game.currentPlayer === player.playerId &&
                                                    <span className="text-[10px] sm:text-xs text-orange-500">• Current Turn</span>
                                                }
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <FaCoins className="text-yellow-500 text-xs sm:text-sm" />
                                            <span className="font-medium text-xs sm:text-sm">{game.stake}</span>
                                        </div>
                                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${game.status === 'playing' ? 'bg-green-100 text-green-800' :
                                                game.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                                    game.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {game.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm flex items-center gap-1 ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    }`}
                            >
                                <FaChevronLeft className="text-xs" />
                                Prev
                            </button>

                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) => (
                                    <button
                                        key={index}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        disabled={page === '...' || page === currentPage}
                                        className={`
                      min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 flex items-center justify-center rounded-md text-xs sm:text-sm
                      ${page === currentPage
                                                ? 'bg-blue-600 text-white'
                                                : page === '...'
                                                    ? 'cursor-default'
                                                    : 'bg-white hover:bg-gray-100 text-gray-700'
                                            }
                      ${typeof page === 'number' ? 'hover:bg-blue-50' : ''}
                      transition-colors duration-200
                    `}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm flex items-center gap-1 ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    }`}
                            >
                                Next
                                <FaChevronRight className="text-xs" />
                            </button>
                        </div>

                        <div className="text-xs sm:text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                    </div>

                    {/* Game Details Modal */}
                    {selectedGame && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                            <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-3 sm:mb-4">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                        Game Details - #{selectedGame.gameId}
                                    </h2>
                                    <button
                                        onClick={() => setSelectedGame(null)}
                                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <FaTimes className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                    </button>
                                </div>

                                {isLoadingDetails ? (
                                    <div className="flex justify-center items-center h-40">
                                        <FaSpinner className="animate-spin text-3xl text-blue-600" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 sm:space-y-6">
                                        {/* Game Info */}
                                        <div className="grid grid-cols-2 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500">Status</p>
                                                <p className="text-sm sm:text-base font-medium">{selectedGame.status}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500">Stake</p>
                                                <p className="text-sm sm:text-base font-medium">{selectedGame.betAmount} ETB</p>
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500">Game Type</p>
                                                <p className="text-sm sm:text-base font-medium">{selectedGame.gameType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm text-gray-500">Created At</p>
                                                <p className="text-sm sm:text-base font-medium">
                                                    {new Date(selectedGame.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Players and Cards */}
                                        <div className="space-y-4 sm:space-y-6">
                                            {selectedGame.players.map((player) => (
                                                <div key={player.chatId} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <FaUser className="text-gray-400" />
                                                            <span className="text-sm sm:text-base font-medium">{player.username}</span>
                                                            {selectedGame.currentPlayer === player.chatId && (
                                                                <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                    Current Turn
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className="text-xs sm:text-sm">
                                                                <span className="text-gray-500">Deadwood:</span>{' '}
                                                                <span className="font-medium">{player.deadwood}</span>
                                                            </div>
                                                            <div className="text-xs sm:text-sm">
                                                                <span className="text-gray-500">Score:</span>{' '}
                                                                <span className="font-medium">{player.score}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Player's Hand */}
                                                    <div className="mb-3 sm:mb-4">
                                                        <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Hand</h3>
                                                        <div className="flex flex-wrap gap-1 sm:gap-2">
                                                            {player.hand.map((card, index) => (
                                                                <div key={index} className="w-12 sm:w-16">
                                                                    <Card card={card} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Player's Melds */}
                                                    {player.melds && player.melds.length > 0 && (
                                                        <div>
                                                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Melds</h3>
                                                            <div className="space-y-2">
                                                                {player.melds.map((meld, index) => (
                                                                    <div key={index} className="flex flex-wrap gap-1 sm:gap-2">
                                                                        {meld.cards.map((card, cardIndex) => (
                                                                            <div key={cardIndex} className="w-12 sm:w-16">
                                                                                <Card card={card} />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Deck and Discard Pile */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                                <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Deck ({selectedGame.deck.length})</h3>
                                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                                    {selectedGame.deck.slice(0, 5).map((card, index) => (
                                                        <div key={index} className="w-12 sm:w-16">
                                                            <Card card={{ faceDown: true }} />
                                                        </div>
                                                    ))}
                                                    {selectedGame.deck.length > 5 && (
                                                        <div className="w-12 sm:w-16 h-20 sm:h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                                            <span className="text-xs sm:text-sm text-gray-500">+{selectedGame.deck.length - 5}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                                <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Discard Pile ({selectedGame.discardPile.length})</h3>
                                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                                    {selectedGame.discardPile.slice(-5).map((card, index) => (
                                                        <div key={index} className="w-12 sm:w-16">
                                                            <Card card={card} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Admin;