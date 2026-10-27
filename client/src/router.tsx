import { createBrowserRouter } from 'react-router';
import { HomePage } from './pages/home/HomePage';

// The single route table: pages are declared here and nowhere else.
export const router = createBrowserRouter([{ path: '/', element: <HomePage /> }]);
