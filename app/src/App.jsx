/**
 * App.jsx — Thin router shell
 *
 * All components have been extracted to their own files:
 *   - Layout: src/components/layout/
 *   - Pages:  src/pages/
 *   - UI:     src/components/ui/
 *   - Hooks:  src/hooks/
 *   - Utils:  src/lib/
 *
 * Data: All page data now comes from Sanity (not localStorage).
 * Admin: Use Sanity Studio at http://localhost:3333
 */
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import NeuralFlow from './components/layout/NeuralFlow';
import Navbar from './components/layout/Navbar';

// Quiz components (loaded eagerly — they have their own context)
import QuizLogin from './components/Quiz/QuizLogin';
import QuizEngine from './components/Quiz/QuizEngine';
import { Quiz } from './components/Quiz';

// Lazy-load all pages for smaller initial bundle
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EventRegister = lazy(() => import('./pages/EventRegister'));
const Team = lazy(() => import('./pages/Team'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const Management = lazy(() => import('./pages/Management'));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-acm-cyan font-mono text-xs animate-pulse tracking-[0.5em]">:: LOADING...</div>
  </div>
);

const App = () => (
  <HashRouter>
    <NeuralFlow />
    <Navbar />
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/events/:slug/register" element={<EventRegister />} />
        <Route path="/team" element={<Team />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/management" element={<Management />} />
        <Route path="/quiz/login" element={<QuizLogin />} />
        <Route path="/quiz/exam" element={<QuizEngine />} />
        <Route path="/quiz-submission" element={<Quiz />} />
      </Routes>
    </Suspense>
  </HashRouter>
);

export default App;
