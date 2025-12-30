import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect } from 'react';
import socket from './services/socket';
import Host from './pages/Host';
import Play from './pages/Play';

function App() {
  useEffect(() => {
    // Only connect when needed by components, or here if global
    // socket.connect();

    return () => {
      // socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center">
        <Routes>
          <Route path="/" element={
            <div className="text-center space-y-8">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                A Mente Coletiva
              </h1>
              <div className="flex gap-4 justify-center">
                <Link to="/host" className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition font-bold text-xl">
                  Sou o Host (TV)
                </Link>
                <Link to="/play" className="px-6 py-3 bg-pink-600 rounded-lg hover:bg-pink-700 transition font-bold text-xl">
                  Sou Jogador (Celular)
                </Link>
              </div>
            </div>
          } />
          <Route path="/host" element={<Host />} />
          <Route path="/play" element={<Play />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App;
