import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatRooms as allChatRooms, chatMessages as initialMessages, users } from '../data/mockData';
import { ChatRoom, ChatMessage } from '../types';

const Chat: React.FC = () => {
    const { user } = useAuth();
    
    const chatRooms = useMemo(() => {
        if (!user) return [];
        return allChatRooms.filter(room => room.participantIds.includes(user.id));
    }, [user]);

    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeRoomId]);

    const handleSelectRoom = (roomId: string) => {
        setActiveRoomId(roomId);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeRoomId || !user) return;

        const newMsg: ChatMessage = {
            id: Date.now(), // Use timestamp for unique ID in mock environment
            roomId: activeRoomId,
            senderId: user.id,
            text: newMessage,
            timestamp: new Date().toISOString(),
        };

        // In a real app, this would be an API call.
        // Here, we're directly updating the component's state to simulate real-time.
        setMessages(prevMessages => [...prevMessages, newMsg]);
        setNewMessage('');
    };
    
    const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'مجهول';
    const activeRoom = chatRooms.find(r => r.id === activeRoomId);

    if (chatRooms.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-white rounded-xl shadow-md p-6">
                <div className="text-center text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <p className="mt-2 font-semibold">لا توجد غرف محادثة متاحة لك حالياً.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full md:flex bg-white rounded-xl shadow-md overflow-hidden">
            {/* Sidebar with chat rooms */}
            <div className={`${activeRoomId ? 'hidden' : 'flex'} w-full md:w-1/3 md:flex flex-col border-l border-slate-200`}>
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold">المحادثات</h2>
                </div>
                <ul className="overflow-y-auto flex-1">
                    {chatRooms.map(room => {
                         const lastMessage = messages
                            .filter(m => m.roomId === room.id)
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                        return (
                        <li key={room.id}>
                            <button 
                                onClick={() => handleSelectRoom(room.id)}
                                className={`w-full text-right p-4 border-b border-slate-100 hover:bg-sky-50 transition-colors duration-150 ${activeRoomId === room.id ? 'bg-sky-100' : ''}`}
                            >
                                <p className="font-semibold text-slate-800">{room.name}</p>
                                <p className="text-sm text-slate-500 truncate">
                                    {lastMessage ? `${getUserName(lastMessage.senderId)}: ${lastMessage.text}` : 'لا توجد رسائل'}
                                </p>
                            </button>
                        </li>
                    )})}
                </ul>
            </div>

            {/* Main chat window */}
            <div className={`${activeRoomId ? 'flex' : 'hidden'} w-full md:w-2/3 md:flex flex-col`}>
                {activeRoom ? (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center">
                             <button onClick={() => setActiveRoomId(null)} className="md:hidden ml-4 text-slate-600 hover:text-sky-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h14" /></svg>
                            </button>
                            <h3 className="font-bold text-lg text-slate-800">{activeRoom.name}</h3>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-100 space-y-4">
                            {messages.filter(m => m.roomId === activeRoomId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(msg => {
                                const isMe = msg.senderId === user?.id;
                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`max-w-xl p-3 rounded-xl ${isMe ? 'bg-sky-700 text-white rounded-br-none' : 'bg-white shadow-sm rounded-bl-none'}`}>
                                            {!isMe && <p className="text-xs font-bold text-teal-600 mb-1">{getUserName(msg.senderId)}</p>}
                                            <p className="text-base">{msg.text}</p>
                                            <p className={`text-xs mt-2 text-right ${isMe ? 'text-sky-200' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200">
                            <form onSubmit={handleSendMessage} className="flex space-x-3 space-x-reverse">
                                <input 
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="اكتب رسالتك هنا..."
                                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white text-slate-900"
                                    autoComplete="off"
                                />
                                <button type="submit" className="px-6 py-3 bg-sky-700 text-white font-semibold rounded-lg hover:bg-sky-800 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors" disabled={!newMessage.trim()}>
                                    إرسال
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50">
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p className="mt-2">اختر محادثة من القائمة لبدء الدردشة.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;