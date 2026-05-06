import { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = "0746d9ba9b6cd85ed8cbc72a8b5dedf2";
const GEMINI_KEY = "AIzaSyCtO1ueiwSl8oTvC0-IGOCa1NZttr_hh1Y";

const IMG = "https://image.tmdb.org/t/p/w500";

export default function App() {
  const [calm, setCalm] = useState([]);
  const [emotional, setEmotional] = useState([]);
  const [escape, setEscape] = useState([]);
  const [explore, setExplore] = useState([]);
  const [aiMovies, setAiMovies] = useState([]);
  const [watchlist, setWatchlist] = useState(
    JSON.parse(localStorage.getItem("watchlist")) || []
  );
  const [refresh, setRefresh] = useState(0);
  const [input, setInput] = useState("");

  /* ================= FETCH MOVIES ================= */
  useEffect(() => {
    const page = Math.floor(Math.random() * 10) + 1;

    axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=18&page=${page}`)
      .then(res => setCalm(res.data.results));

    axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=18,10749&page=${page}`)
      .then(res => setEmotional(res.data.results));

    axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=35,28&page=${page}`)
      .then(res => setEscape(res.data.results));

    axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&primary_release_date.lte=2012-01-01&page=${page}`)
      .then(res => setExplore(res.data.results));

  }, [refresh]);

  /* ================= GEMINI FIX ================= */
  const getAI = async () => {
    if (!input) return;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Suggest 3 movies for mood: ${input}` }]
            }]
          })
        }
      );

      const data = await res.json();

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        alert("Gemini failed. Check API key.");
        return;
      }

      const names = text.split("\n").slice(0, 3);

      const results = [];

      for (let name of names) {
        const r = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${name}`
        );
        if (r.data.results.length > 0) {
          results.push(r.data.results[0]);
        }
      }

      setAiMovies(results);

    } catch (err) {
      console.log(err);
      alert("Gemini error. Check console.");
    }
  };

  /* ================= WATCHLIST ================= */
  const addToWatchlist = (movie) => {
    if (watchlist.find(m => m.id === movie.id)) return;

    const updated = [...watchlist, movie];
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
  };

  const removeFromWatchlist = (id) => {
    const updated = watchlist.filter(m => m.id !== id);
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
  };

  /* ================= CAROUSEL ================= */
  const Row = ({ title, subtitle, movies, isWatchlist }) => (
    <div className="mt-12 px-6">
      <h2 className="text-xl text-gray-200">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {movies.map((m) => (
          <div key={m.id} className="relative min-w-[160px] group">

            <img
              src={m.poster_path ? `${IMG}${m.poster_path}` : "https://via.placeholder.com/160x240"}
              className="h-[240px] w-[160px] object-cover rounded-xl hover:scale-110 transition group-hover:brightness-50"
            />

            {/* ADD / REMOVE BUTTON */}
            {!isWatchlist ? (
              <button
                onClick={() => addToWatchlist(m)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 px-2 py-1 rounded-full text-xs"
              >
                ❤️
              </button>
            ) : (
              <button
                onClick={() => removeFromWatchlist(m.id)}
                className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-full text-xs"
              >
                ✖
              </button>
            )}

            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100">
              <p className="text-sm">{m.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <div className="flex justify-between px-6 py-4">
        <h1>MOODFLIX 🎬</h1>

        <button
          onClick={() => setRefresh(prev => prev + 1)}
          className="border px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      {/* HERO FIXED */}
      <div className="relative h-[70vh] flex items-center px-10">

        {/* IMAGE */}
        <img
          src="https://i.ibb.co/dd1KB7m/moodflix.png"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* TEXT CONTENT */}
        <div className="relative z-10 max-w-xl">

          <h1 className="text-5xl font-semibold leading-tight">
            Let your <span className="text-[#b8a4c9]">mood</span> choose your story
          </h1>

          <p className="mt-4 text-gray-300">
            Tell us how you feel — we’ll find something that fits.
          </p>

          {/* INPUT */}
          <div className="mt-6 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your mood..."
              className="w-full p-4 rounded-full bg-white/10 border"
            />

            <button
              onClick={getAI}
              className="bg-white text-black px-4 rounded-full"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* AI RESULTS */}
      {aiMovies.length > 0 && (
        <Row title="AI picked for you" subtitle="Based on your mood" movies={aiMovies} />
      )}

      <Row title="Relax & unwind" subtitle="Slow stories" movies={calm} />
      <Row title="Feel something real" subtitle="Emotional picks" movies={emotional} />
      <Row title="Quick escape" subtitle="Fun movies" movies={escape} />
      <Row title="Discover gems" subtitle="Hidden classics" movies={explore} />

      {/* WATCHLIST */}
      {watchlist.length > 0 && (
        <Row
          title="Saved for later"
          subtitle="Your personal collection"
          movies={watchlist}
          isWatchlist
        />
      )}
    </div>
  );
}