'use client';

import { Tweet } from 'react-tweet';

interface TweetClientProps {
  tweetId: string;
}

export function TweetClient({ tweetId }: TweetClientProps) {
  return (
    <div className="twitter-embed">
      <Tweet id={tweetId} />
    </div>
  );
}
