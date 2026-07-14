import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

// تحديث النوع ليتوافق مع قاعدة البيانات الجديدة
type BillboardItem = { id: string; media_url: string; media_type: string; };

export default function Stories() {
  const [stories, setStories] = useState<BillboardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isPausedRef = useRef(false);
  const isTapRef = useRef(true);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    async function fetchStories() {
      // جلب البيانات من جدول billboard وعرض الفعالة فقط
      const { data } = await supabase
        .from('billboard')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: true }); // لعرضها بالترتيب

      if (data && data.length > 0) {
        setStories(data);
      } else {
        // بيانات تجريبية في حال كانت اللوحة فارغة
        setStories([
          { id: '3', media_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1600&h=900&fit=crop', media_type: 'image' }
        ]);
      }
    }
    fetchStories();
  }, []);

  const goToNext = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const goToPrev = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (stories.length === 0) return;
    const currentStory = stories[currentIndex];
    
    // الاعتماد على media_type لتحديد نوع الملف
    const isVideo = currentStory.media_type === 'video';

    if (!isVideo) {
      const interval = setInterval(() => {
        if (!isPausedRef.current) {
          setProgress((prev) => {
            if (prev >= 100) {
              setTimeout(() => goToNext(), 0);
              return 0;
            }
            return prev + 1; // يزيد 1% كل 50 ملي ثانية (المجموع 5 ثواني)
          });
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [currentIndex, stories]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, currentIndex]);

  const handleVideoProgress = () => {
    if (videoRef.current && !isPausedRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  };

  const handlePointerDown = () => {
    setIsPaused(true); 
    isTapRef.current = true; 
    
    holdTimeoutRef.current = setTimeout(() => {
      isTapRef.current = false; 
    }, 200);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPaused(false);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    if (isTapRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      if (clickX < rect.width * 0.5) {
        goToNext();
      } else {
        goToPrev(); 
      }
    }
  };

  if (stories.length === 0) return null;

  const currentStory = stories[currentIndex];
  const isVideo = currentStory.media_type === 'video';

  return (
    <div 
      className="billboard-container"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setIsPaused(false)}
      onContextMenu={(e) => e.preventDefault()} 
    >
      <div className="progress-container">
        {stories.map((s, i) => (
          <div key={s.id} className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {isVideo ? (
        <video
          ref={videoRef}
          src={currentStory.media_url}
          autoPlay
          muted
          playsInline
          onEnded={goToNext}
          onTimeUpdate={handleVideoProgress}
          className="billboard-media"
        />
      ) : (
        <img src={currentStory.media_url} alt="Store Ad" className="billboard-media" />
      )}
    </div>
  );
}