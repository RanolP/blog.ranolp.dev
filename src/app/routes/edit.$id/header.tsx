import { useFetcher } from 'react-router';
import { Icon } from '@iconify/react';
import { BackButton } from '~/components/BackButton';
import { SaveStatus } from './save-indicator';
import { useSaveState } from './edit-wrapper';

interface EditHeaderProps {
  isDraft: boolean;
  postId: string;
}

export function EditHeader({ isDraft, postId }: EditHeaderProps) {
  const { isSaving, lastSavedAt } = useSaveState();
  const fetcher = useFetcher();

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

  return (
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
  );
}
