import React from 'react';
import { createRoot } from 'react-dom/client';
import StoryScreen from './story-screen.js';

const stories = {
  intake: () => import('./flows/intake-flow.js'),
  normalize: () => import('./flows/normalize-flow.js'),
  condense: () => import('./flows/condense-flow.js'),
  retrieve: () => import('./flows/retrieve-flow.js'),
  validate: () => import('./flows/validate-flow.js'),
  assign: () => import('./flows/assign-flow.js')
};
let root;

export async function mountStory(stage, previous, next, onClose, onPrev, onNext, isCurrent) {
  const module = await stories[stage.slug]();
  if (!isCurrent()) return;
  if (!root) root = createRoot(document.getElementById('storyMount'));
  root.render(React.createElement(StoryScreen, {
    story: module[`${stage.slug}Story`],
    id: stage.number,
    label: stage.label,
    title: stage.title,
    kind: stage.kind,
    onClose,
    onPrev,
    onNext,
    prevTitle: previous.title,
    nextTitle: next.title
  }));
}
