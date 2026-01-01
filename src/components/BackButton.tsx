import { useNavigate } from 'react-router';
import { Icon } from '@iconify/react';

export function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    // If history is empty (length <= 1), navigate to index page
    if (window.history.length <= 1) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      <Icon icon="lucide:arrow-left" className="w-4 h-4" />
      Back
    </button>
  );
}
