import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import CardPage from './pages/cardPage.jsx';
import FormPage from './pages/formPage.jsx';
import OutletLayout from './outlet-layout.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <OutletLayout />,
    children: [
      {
        path: "",
        element: <FormPage />
      },
      {
        path: "card",
        element: <CardPage />
      }
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)