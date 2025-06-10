/* @refresh reload */
import './index.css';
import { render } from 'solid-js/web';

import App from './App';
import Dashboard from './Dashboard';

render(() => {
    if (location.pathname.startsWith('/signup/dashboard') || location.pathname.startsWith('/signup/dashboard/reset')) {
        return <Dashboard />;
    } else {
        return <App />;
    }
}, document.getElementById('root'));
