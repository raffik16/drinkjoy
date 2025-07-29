'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FiSend, FiX, FiRefreshCw } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { MessageBubble, Message } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickSuggestions } from './QuickSuggestions';

interface AIChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  onPreferencesReady?: (preferences: Record<string, unknown>) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ isOpen, onClose, className, onPreferencesReady }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Generate session ID and load conversation from localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem('drinkjoy-chat-session');
    const storedMessages = localStorage.getItem('drinkjoy-chat-messages');
    
    if (storedSessionId && storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: Message & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        setSessionId(storedSessionId);
      } catch (e) {
        console.error('Failed to restore chat history:', e);
        const newSessionId = `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        localStorage.setItem('drinkjoy-chat-session', newSessionId);
      }
    } else {
      const newSessionId = `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('drinkjoy-chat-session', newSessionId);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('drinkjoy-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartOver = () => {
    setMessages([]);
    setInputValue('');
    setIsTyping(false);
    setError(null);
    setRetryCount(0);
    localStorage.removeItem('drinkjoy-chat-messages');
    const newSessionId = `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem('drinkjoy-chat-session', newSessionId);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (content: string, retryAttempt = 0) => {
    if (!content.trim() || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    if (retryAttempt === 0) {
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
    }
    
    setIsTyping(true);
    setError(null);
    setRetryCount(retryAttempt);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }


      // Handle preferences if ready
      if (data.preferences && data.is_ready && onPreferencesReady) {
        onPreferencesReady(data.preferences);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        quickButtons: data.buttons ? data.buttons.map((btn: {text: string; value: string; type: string}) => btn.text) : undefined,
        drinks: data.drinks
      };
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Implement retry logic
      if (retryAttempt < MAX_RETRIES) {
        setError(`Connection failed. Retrying... (${retryAttempt + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          handleSendMessage(content, retryAttempt + 1);
        }, RETRY_DELAY * Math.pow(2, retryAttempt)); // Exponential backoff
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'I\'m having trouble connecting right now. Please check your internet connection and try again.',
          role: 'system',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setError('Failed to connect after multiple attempts.');
      }
    } finally {
      if (retryAttempt >= MAX_RETRIES || !error) {
        setIsTyping(false);
        setRetryCount(0);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleQuickSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'fixed bottom-24 right-6 z-50',
              'w-[calc(100vw-3rem)] md:w-[28rem] lg:w-[32rem]', // Wider to accommodate drink cards
              'h-[calc(100vh-12rem)]',
              'bg-white dark:bg-gray-900',
              'rounded-2xl shadow-2xl',
              'flex flex-col overflow-hidden',
              'border border-gray-200 dark:border-gray-800',
              className
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                    <HiSparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Carla Joy
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ask about drinks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={handleStartOver}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Start over"
                      title="Start over"
                    >
                      <FiRefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close chat"
                  >
                    <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
            </div>

            {/* Error Banner */}
            {error && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-900/30 flex items-center justify-center">
                    <HiSparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Welcome to Carla Joy!
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    I&apos;m here to help you discover the perfect drink based on your preferences.
                  </p>
                  <QuickSuggestions onSelect={handleQuickSuggestion} />
                  
                  {/* Clear Chat Button */}
                  <button
                    onClick={handleStartOver}
                    className="mt-4 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                  >
                    Clear chat history
                  </button>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      onQuickResponse={handleSendMessage}
                    />
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                        <HiSparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me about drinks..."
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'border border-gray-300 dark:border-gray-700',
                    'placeholder-gray-500 dark:placeholder-gray-400',
                    'text-gray-800 dark:text-gray-200',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500',
                    'transition-all duration-200'
                  )}
                />
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-2 rounded-lg',
                    'bg-gradient-to-r from-purple-600 to-purple-500',
                    'text-white',
                    'hover:from-purple-700 hover:to-purple-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500',
                    'transition-all duration-200'
                  )}
                  aria-label="Send message"
                >
                  <FiSend className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>

        </>
      )}
    </AnimatePresence>
  );
};