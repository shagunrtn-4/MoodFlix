import { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_KEY;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

const IMG = "https://image.tmdb.org/t/p/w500";

export default function App() {
  const [calm, setCalm] = useState([]);
  const [emotional, setEmotional] = useState([]);
  const [escape, setEscape] = useState([]);
  const [explore, setExplore] = useState([]);
  const [aiMovies, setAiMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [watchlist, setWatchlist] = useState(
    JSON.parse(localStorage.getItem("watchlist")) || []
  );

  const [refresh, setRefresh] = useState(0);
  const [input, setInput] = useState("");

  /* ================= FETCH MOVIES ================= */

  useEffect(() => {
    const page = Math.floor(Math.random() * 10) + 1;

    axios
      .get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=18&page=${page}`
      )
      .then((res) => setCalm(res.data.results));

    axios
      .get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=18,10749&page=${page}`
      )
      .then((res) => setEmotional(res.data.results));

    axios
      .get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=35,28&page=${page}`
      )
      .then((res) => setEscape(res.data.results));

    axios
      .get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&primary_release_date.lte=2012-01-01&page=${page}`
      )
      .then((res) => setExplore(res.data.results));
  }, [refresh]);

  /* ================= GEMINI AI ================= */

  const getAI = async () => {
    if (!input) return;

    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Suggest 5 movies for someone feeling ${input}. Only give movie names separated by commas.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!text) {
        alert("Gemini not responding.");
        setLoading(false);
        return;
      }

      const movieNames = text.split(",");

      const fetchedMovies = [];

      for (let movie of movieNames) {
        const res = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${movie.trim()}`
        );

        if (res.data.results.length > 0) {
          fetchedMovies.push(res.data.results[0]);
        }
      }

      setAiMovies(fetchedMovies);
      setLoading(false);

    } catch (error) {
      console.log(error);
      alert("Gemini still failing.");
      setLoading(false);
    }
  };

  /* ================= WATCHLIST ================= */

  const addToWatchlist = (movie) => {
    if (watchlist.find((m) => m.id === movie.id)) return;

    const updated = [...watchlist, movie];

    setWatchlist(updated);

    localStorage.setItem("watchlist", JSON.stringify(updated));
  };

  const removeFromWatchlist = (id) => {
    const updated = watchlist.filter((m) => m.id !== id);

    setWatchlist(updated);

    localStorage.setItem("watchlist", JSON.stringify(updated));
  };

  /* ================= ROW ================= */

  const Row = ({ title, subtitle, movies, isWatchlist }) => (
    <div className="mt-14 px-6">
      <h2 className="text-3xl font-bold text-white mb-2">
        {title}
      </h2>

      <p className="text-gray-400 mb-5">{subtitle}</p>

      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {movies.map((m) => (
          <div
            key={m.id}
            className="relative min-w-[170px] group"
          >
            <img
              src={
                m.poster_path
                  ? `${IMG}${m.poster_path}`
                  : "https://via.placeholder.com/170x250"
              }
              alt={m.title}
              className="h-[250px] w-[170px] object-cover rounded-2xl transition duration-300 hover:scale-105 group-hover:brightness-50"
            />

            {/* TITLE */}

            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition">
              <p className="text-sm font-semibold">
                {m.title}
              </p>
            </div>

            {/* WATCHLIST */}

            {!isWatchlist ? (
              <button
                onClick={() => addToWatchlist(m)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-black/70 px-2 py-1 rounded-full"
              >
                ❤️
              </button>
            ) : (
              <button
                onClick={() => removeFromWatchlist(m.id)}
                className="absolute top-3 right-3 bg-red-600 px-2 py-1 rounded-full"
              >
                ✖
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* NAVBAR */}

      <div className="flex justify-between items-center px-6 py-5 absolute z-20 w-full">
        <h1 className="text-2xl font-bold tracking-wide">
          MOODFLIX 🎬
        </h1>

        <button
          onClick={() => setRefresh((prev) => prev + 1)}
          className="border border-white/30 px-4 py-2 rounded-xl hover:bg-white hover:text-black transition"
        >
          Refresh
        </button>
      </div>

      {/* HERO SECTION */}

      <div className="relative h-screen flex items-center px-8 md:px-16">

        {/* BG IMAGE */}

        <img
          src="https://i.ibb.co/dd1KB7m/moodflix.png"
          alt="hero"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* OVERLAY */}

        <div className="absolute inset-0 bg-black/70"></div>

        {/* CONTENT */}

        <div className="relative z-10 max-w-2xl">

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Let your{" "}
            <span className="text-[#b8a4c9]">mood</span>
            <br />
            choose your story
          </h1>

          <p className="mt-6 text-lg text-gray-300">
            Tell us how you feel and MoodFlix will
            recommend movies matching your vibe.
          </p>

          {/* SEARCH */}

          <div className="mt-8 flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="happy, lonely, romantic..."
              className="w-full p-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 outline-none text-white"
            />

            <button
              onClick={getAI}
              className="bg-white text-black px-8 rounded-full font-semibold hover:scale-105 transition"
            >
              {loading ? "..." : "Go"}
            </button>
          </div>

          {/* QUICK MOODS */}

          <div className="flex flex-wrap gap-3 mt-8">
            {[
              "Romantic",
              "Happy",
              "Lonely",
              "Emotional",
              "Adventurous",
            ].map((mood) => (
              <button
                key={mood}
                onClick={() => setInput(mood)}
                className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition"
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI MOVIES */}

      {aiMovies.length > 0 && (
        <Row
          title="AI Picked For You"
          subtitle="Generated according to your mood"
          movies={aiMovies}
        />
      )}

      {/* NORMAL ROWS */}

      <Row
        title="Relax & unwind"
        subtitle="Slow calming stories"
        movies={calm}
      />

      <Row
        title="Feel something real"
        subtitle="Emotional and romantic films"
        movies={emotional}
      />

      <Row
        title="Quick escape"
        subtitle="Fun action and comedy movies"
        movies={escape}
      />

      <Row
        title="Discover gems"
        subtitle="Classic hidden masterpieces"
        movies={explore}
      />

      {/* WATCHLIST */}

      {watchlist.length > 0 && (
        <Row
          title="Saved for later"
          subtitle="Your personal collection"
          movies={watchlist}
          isWatchlist={true}
        />
      )}

      {/* FOOTER */}

      <div className="text-center text-gray-500 py-10 mt-10">
        MoodFlix • AI Movie Recommendation Platform
      </div>
    </div>
  );
}