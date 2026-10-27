import { createBrowserRouter, type RouteObject } from 'react-router';
import { HomePage } from './pages/home/HomePage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';

// The single route table: pages are declared here and nowhere else.
// The catch-all is last and only matches when nothing above it does.
export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
