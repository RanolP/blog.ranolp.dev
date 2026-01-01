'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tweet } from 'react-tweet/api';

export type TweetIndex = Record<string, Tweet>;

const TweetIndexContext = createContext<TweetIndex | null>(null);

interface TweetIndexProviderProps {
  tweets: TweetIndex;
  children: ReactNode;
}

export function TweetIndexProvider({
  tweets,
  children,
}: TweetIndexProviderProps) {
  return (
    <TweetIndexContext.Provider value={tweets}>
      {children}
    </TweetIndexContext.Provider>
  );
}

export function useTweetIndex(): TweetIndex | null {
  return useContext(TweetIndexContext);
}

export function useTweet(tweetId: string): Tweet | undefined {
  const index = useContext(TweetIndexContext);
  return index?.[tweetId];
}
