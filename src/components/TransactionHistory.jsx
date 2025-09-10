import React, { useEffect, useState } from 'react';
import { IoMdCloseCircle } from 'react-icons/io'; 
import { useGetUserInfo } from '../utils/getUserinfo';
import {apiUrl} from '../utils/apiUrl';

function TransactionHistory({ isOpen, onClose }) {
    const [recentCredits, setRecentCredits] = useState([]);
    const [userTransactions, setUserTransactions] = useState([]);
    const { userInfo } = useGetUserInfo(localStorage.getItem('cardgametoken')); 
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('winners');

    useEffect(() => {
        const fetchRecentCredits = async () => {
            setError(null);
            setLoading(true);
            try {
                const token = localStorage.getItem('cardgametoken');
                const response = await fetch(`${apiUrl}/api/transactions/recent-credits`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setRecentCredits(data.transactions);
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                setError('Failed to fetch recent winners');
            } finally {
                setLoading(false);
            }
        };

        const fetchUserTransactions = async () => {
            setError(null);
            setLoading(true);
            try {
                const token = localStorage.getItem('cardgametoken');
                const response = await fetch(`${apiUrl}/api/transactions/user-history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setUserTransactions(data.transactions);
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                setError('Failed to fetch transaction history');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'winners') {
            fetchRecentCredits();
        } else if (activeTab === 'myBets') {
            fetchUserTransactions();
        }
    }, [activeTab]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-xl border border-white/10 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
                >
                    <IoMdCloseCircle size={24} />
                </button>

                <div className="p-6 space-y-6">
                    {/* Title Panel */}
                    <div className="border-b border-white/10 pb-4">
                        <h1 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Conquer Bet History
                        </h1>
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex rounded-lg overflow-hidden bg-white/5 p-1">
                        <button
                            onClick={() => setActiveTab('winners')}
                            className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 ${
                                activeTab === 'winners'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md'
                                    : 'text-purple-200 hover:text-white'
                            }`}
                        >
                            Recent Winners
                        </button>
                        <button
                            onClick={() => setActiveTab('myBets')}
                            className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 ${
                                activeTab === 'myBets'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md'
                                    : 'text-purple-200 hover:text-white'
                            }`}
                        >
                            My Transactions
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-500/20 backdrop-blur-lg rounded-md border border-red-500/20 p-4 text-red-200 text-sm text-center">
                                {error}
                            </div>
                        ) : activeTab === 'winners' ? (
                            <div>
                                <div className="grid grid-cols-4 gap-4 font-semibold mb-3 text-purple-300 text-sm">
                                    <span>Date</span> 
                                    <span>Winner</span>
                                    <span>Game Id</span>  
                                    <span>Amount</span>
                                </div>
                                <ul className="space-y-2">
                                    {recentCredits?.map((credit) => (
                                        <li 
                                            key={credit._id} 
                                            className="grid grid-cols-4 gap-4 bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-lg hover:bg-white/10 transition-all duration-200"
                                        >
                                            <span className="text-purple-200/90">{new Date(credit.createdAt).toLocaleString('en-US', {
                                                year: '2-digit',
                                                month: 'numeric', 
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                hour12: false
                                            })}</span> 
                                            <span className="text-purple-200/90">
                                                {credit.username.slice(0, 3) + '***'}
                                            </span>
                                            <span className="text-purple-200/90">{credit.round_id}</span>  
                                            <span className="text-green-300">{credit.amount} ETB</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-4 gap-4 font-semibold mb-3 text-purple-300 text-sm">
                                    <span>Date</span> 
                                    <span>Game Id</span>
                                    <span>Type</span>
                                    <span>Amount</span> 
                                </div>
                                <ul className="space-y-2">
                                    {userTransactions?.map((transaction) => (
                                        <li 
                                            key={transaction._id} 
                                            className={`grid grid-cols-4 gap-4 backdrop-blur-sm border border-white/10 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 ${
                                                transaction.transaction_type === 'credit' 
                                                    ? 'bg-green-500/10' 
                                                    : 'bg-white/5'
                                            }`}
                                        >
                                            <span className="text-purple-200/90">{new Date(transaction.createdAt).toLocaleString('en-US', {
                                                year: '2-digit',
                                                month: 'numeric', 
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                hour12: false
                                            })}</span> 
                                            <span className="text-purple-200/90">{transaction.round_id}</span>
                                            <span className={transaction.transaction_type === 'credit' ? 'text-green-400' : 'text-purple-200/90'}>
                                                {transaction.transaction_type}
                                            </span>
                                            <span className={transaction.transaction_type === 'credit' ? 'text-green-300' : 'text-purple-200/90'}>
                                                {transaction.amount} ETB
                                            </span> 
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TransactionHistory; 