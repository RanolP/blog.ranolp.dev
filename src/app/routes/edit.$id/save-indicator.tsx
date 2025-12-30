'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 30) return 'a few seconds ago';
  if (diffSec < 60) return `about ${diffSec} seconds ago`;
  if (diffMin === 1) return 'a minute ago';
  if (diffMin < 10) return 'a few minutes ago';
  if (diffMin < 60) return `about ${diffMin} minutes ago`;
  if (diffHour === 1) return 'about an hour ago';
  if (diffHour < 24) return `about ${diffHour} hours ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `about ${diffDay} days ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDay >= 365 ? 'numeric' : undefined,
  });
}

export function SaveStatus({
  isSaving,
  lastSavedAt,
}: {
  isSaving: boolean;
  lastSavedAt: Date | null;
}) {
  const [, setTick] = useState(0);

  // Update time display only on window focus
  useEffect(() => {
    if (!lastSavedAt || isSaving) return;

    const handleFocus = () => {
      setTick((t) => t + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastSavedAt, isSaving]);

  // Hide if no save has occurred yet and not currently saving
  if (!isSaving && !lastSavedAt) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {isSaving ? (
        <>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Icon
            icon="lucide:check"
            className="w-4 h-4 text-green-600 dark:text-green-400"
          />
          <span>Saved {formatTime(lastSavedAt!)}</span>
        </>
      )}
    </div>
  );
}
