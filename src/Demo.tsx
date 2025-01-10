import React from 'react';

import ReactDOM from 'react-dom/client';

import { Backlog } from './Backlog';

const href = 'https://growi.org/';

const DemoBacklog = Backlog(() => <a href={href}>Hello, GROWI</a>);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DemoBacklog
      href={href}
    >Hello, GROWI</DemoBacklog>
  </React.StrictMode>,
);
