import React from 'react';
import { createRoot } from 'react-dom/client';
import FullFlow from './full-flow.js';

let root;

export function mountFullFlow() {
  if (root) return;
  const mount = document.getElementById('fullFlowMount');
  root = createRoot(mount);
  root.render(React.createElement(FullFlow));
}
