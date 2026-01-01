import { useState, useEffect, useRef } from 'react';
import { useFetcher } from 'react-router';
import { Icon } from '@iconify/react';
import { BackButton } from '~/components/BackButton';
import { SaveStatus } from './save-indicator';
import { useSaveState } from './edit-wrapper';

interface EditHeaderProps {
  isDraft: boolean;
  postId: string;
  currentSlug: string;
}

export function EditHeader({ isDraft, postId, currentSlug }: EditHeaderProps) {
  const { isSaving, lastSavedAt } = useSaveState();
  const fetcher = useFetcher();
  const slugFetcher = useFetcher();
  const [slug, setSlug] = useState(currentSlug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update slug when currentSlug prop changes
  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  // Handle slug action errors
  useEffect(() => {
    if (slugFetcher.data && 'error' in slugFetcher.data) {
      setSlugError(slugFetcher.data.error as string);
    } else if (slugFetcher.data && 'success' in slugFetcher.data) {
      setSlugError(null);
    }
  }, [slugFetcher.data]);

  const handlePublish = () => {
    fetcher.submit(
      { publish: 'true' },
      {
        method: 'post',
        action: `/edit/${postId}`,
      },
    );
  };

  const handleUnpublish = () => {
    fetcher.submit(
      { unpublish: 'true' },
      {
        method: 'post',
        action: `/edit/${postId}`,
      },
    );
  };

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    setSlugError(null);

    // Validate slug format (alphanumeric, hyphens, underscores only)
    if (newSlug && !/^[a-zA-Z0-9_-]+$/.test(newSlug)) {
      setSlugError(
        'Slug can only contain letters, numbers, hyphens, and underscores',
      );
      return;
    }

    // Clear existing timeout
    if (slugTimeoutRef.current) {
      clearTimeout(slugTimeoutRef.current);
    }

    // Debounce slug save
    slugTimeoutRef.current = setTimeout(() => {
      if (newSlug && newSlug !== currentSlug) {
        slugFetcher.submit(
          { slug: newSlug },
          {
            method: 'post',
            action: `/edit/${postId}`,
          },
        );
      }
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (slugTimeoutRef.current) {
        clearTimeout(slugTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          {isDraft && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              Draft
            </span>
          )}
          <span className="px-2 py-1 text-xs font-medium bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-300 rounded">
            Editing
          </span>
          <SaveStatus isSaving={isSaving} lastSavedAt={lastSavedAt} />
        </div>
        {isDraft ? (
          <button
            onClick={handlePublish}
            disabled={fetcher.state === 'submitting'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="lucide:send" className="w-4 h-4" />
            {fetcher.state === 'submitting' ? 'Publishing...' : 'Publish'}
          </button>
        ) : (
          <button
            onClick={handleUnpublish}
            disabled={fetcher.state === 'submitting'}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon="lucide:eye-off" className="w-4 h-4" />
            {fetcher.state === 'submitting' ? 'Unpublishing...' : 'Unpublish'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="slug-input"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
        >
          Slug:
        </label>
        <div className="flex-1 max-w-md">
          <input
            id="slug-input"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              slugError ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="post-slug"
          />
          {slugError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {slugError}
            </p>
          )}
        </div>
        {slug && !slugError && (
          <a
            href={`/post/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Icon icon="lucide:external-link" className="w-4 h-4" />
            View
          </a>
        )}
      </div>
    </div>
  );
}
