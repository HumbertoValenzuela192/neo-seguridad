import { solveDepth } from './metalDepth.js';

self.onmessage = ({ data }) => {
  const u = solveDepth(data.shapeMask, data.boundaryMask, data.width, data.height);
  self.postMessage(u, [u.buffer]);
};
