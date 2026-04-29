import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  User, 
  Send, 
  X, 
  MessageCircle, 
  AlertTriangle,
  RefreshCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I'm your **VetsCue assistant**. 🐾 How can I help you today?\n\n*Note: I provide general advice but am not a substitute for professional veterinary care.*",
      isInsight: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('vetscue_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect to the agent.');
      }

      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                aiResponseText += parsed.text;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    text: aiResponseText
                  };
                  return newMessages;
                });
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.error("Stream parse error", e);
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `**Error:** ${error.message}`,
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-[999]"
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: isOpen ? 0 : 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <button 
          onClick={toggleChat}
          className="relative w-16 h-16 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <MessageCircle className="relative z-10 w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </button>
      </motion.div>

      {/* Chatbot Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9, originX: '90%', originY: '90%' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[1000] w-[400px] h-[650px] max-h-[85vh] flex flex-col shadow-2xl rounded-3xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden"
          >
            {/* Header */}
            <header className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold font-['Manrope'] tracking-tight">VetsCue AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Online Assistant</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={toggleChat}
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Chat Area */}
            <div 
              ref={chatScrollRef} 
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth chat-scroll"
            >
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'ai' ? -20 : 20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                      msg.role === 'ai' 
                        ? (msg.isError ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400') 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    
                    <div className={`p-4 rounded-2xl shadow-sm border ${
                      msg.role === 'ai'
                        ? (msg.isError 
                            ? 'bg-red-50/50 border-red-100 text-red-700 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400' 
                            : 'bg-white border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 text-slate-800 dark:text-slate-200')
                        : 'bg-blue-600 border-blue-500 text-white rounded-tr-none'
                    }`}>
                      {msg.isError && <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase"><AlertTriangle size={12} /> Error</div>}
                      
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none break-words">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                            strong: ({children}) => <strong className="font-bold text-blue-600 dark:text-blue-400">{children}</strong>,
                            hr: () => <hr className="my-3 border-slate-100 dark:border-slate-700" />
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center animate-bounce">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer / Input Area */}
            <footer className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              {!user ? (
                <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-center gap-2">
                    <Bot size={14} /> Please log in to start a clinical conversation
                  </p>
                  <Link 
                    to="/login" 
                    onClick={toggleChat}
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 group transition-colors"
                  >
                    Go to Login <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative group">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl py-4 px-6 pr-14 text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                    placeholder="Describe symptoms or ask clinical questions..." 
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              )}
              <div className="flex justify-between items-center mt-4 px-2">
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">VetsCue Intelligence 2.0</span>
                <div className="flex gap-4">
                  <RefreshCcw size={12} className="text-slate-300 hover:text-blue-400 cursor-pointer" />
                  <Sparkles size={12} className="text-slate-300 hover:text-yellow-400 cursor-pointer" />
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
