'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { getSessionId } from '@/lib/session';
import ColorSplashAnimation from '@/app/components/animations/ColorSplashAnimation';
import { analytics } from '@/lib/analytics';

interface LikeButtonProps {
  drinkId: string;
  drinkName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({ drinkId, drinkName = '', className = '', size = 'md' }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const fetchLikeStatus = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/likes?drinkId=${drinkId}&sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [drinkId]);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    
    // Fetch initial like status
    fetchLikeStatus(id);
  }, [drinkId, fetchLikeStatus]);

  const handleLikeToggle = async () => {
    if (isLoading || !sessionId) return;
    
    setIsLoading(true);
    
    // Optimistic update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drinkId,
          sessionId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Use server response for authoritative state
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
        
        // Track the like event in GA
        analytics.trackDrinkLike(drinkId, drinkName, data.liked, data.likeCount);
      } else {
        // Revert optimistic update on error
        setIsLiked(isLiked);
        setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-white ${buttonSizeClasses[size]} ${className}`}>
        <ColorSplashAnimation className='h-[20px] w-[20px]' size="sm" repeat={true} />
      </div>
    );
  }

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`
        flex items-center gap-1 rounded-full transition-all duration-200 
        bg-white text-red-500 hover:bg-purple-50
        ${buttonSizeClasses[size]}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      <Heart 
        className={`${sizeClasses[size]} transition-all duration-200 stroke-2 ${
          isLiked ? 'fill-red-500 stroke-red-500' : 'fill-white stroke-red-500'
        }`}
      />
      {likeCount > 0 && (
        <span className="text-xs font-medium">
          {likeCount}
        </span>
      )}
    </button>
  );
}