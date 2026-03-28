import { useState, useEffect, useRef, useCallback } from "react";

const CONFIG = {
  API_KEY: "86ee090d35e83a015d672f35196f689f",
  BASE_URL: "https://api.themoviedb.org/3",
  IMG_BASE: "https://image.tmdb.org/t/p/w342",
};

/* ─── SKELETON CARD ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={styles.skeletonCard}>
      <div style={styles.skeletonPoster} />
      <div style={styles.skeletonInfo}>
        <div style={{ ...styles.skeletonLine, width: "80%" }} />
        <div style={{ ...styles.skeletonLine, width: "50%" }} />
        <div style={{ ...styles.skeletonLine, width: "50%" }} />
      </div>
    </div>
  );
}

/* ─── MOVIE CARD ────────────────────────────────────────── */
function MovieCard({ movie }) {
  const title = movie.title || movie.original_title || "Unknown";
  const date = movie.release_date || "N/A";
  const rating = movie.vote_average != null ? movie.vote_average : "N/A";
  const imgSrc = movie.poster_path ? `${CONFIG.IMG_BASE}${movie.poster_path}` : null;

  return (
    <div style={styles.movieCard}>
      <div style={styles.posterWrap}>
        {imgSrc ? (
          <img src={imgSrc} alt={title} loading="lazy" style={styles.posterImg} />
        ) : (
          <div style={styles.posterPlaceholder}>
            <span style={{ fontSize: 40 }}>🎬</span>
            <span style={{ fontSize: 13, color: "#aaa" }}>No Image</span>
          </div>
        )}
      </div>
      <div style={styles.cardInfo}>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardMeta}>Release Date: {date}</div>
        <div style={styles.cardMeta}>
          Rating:{" "}
          {typeof rating === "number"
            ? rating.toFixed(1).replace(/\.0$/, "")
            : rating}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────── */
export default function MovieExplorer() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debounceTimer = useRef(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(val);
      setPage(1);
    }, 450);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      api_key: CONFIG.API_KEY,
      page,
      language: "en-US",
    });

    let endpoint;
    if (debouncedQuery.trim()) {
      endpoint = `${CONFIG.BASE_URL}/search/movie`;
      params.set("query", debouncedQuery.trim());
    } else {
      endpoint = `${CONFIG.BASE_URL}/discover/movie`;
      params.set("sort_by", sortBy || "popularity.desc");
      params.set("vote_count.gte", "10");
    }

    try {
      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status_message) throw new Error(data.status_message);
      setTotalPages(data.total_pages || 1);
      setMovies(data.results || []);
    } catch (err) {
      setError(err.message.includes("401") ? "Invalid API key." : err.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, sortBy, page]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const goToPrev = () => {
    if (page > 1) {
      setPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const goToNext = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* ─── RENDER ──────────────────────────────────────────── */
  return (
    <>
      <style>{cssText}</style>
      <div style={styles.app}>
        {/* HEADER */}
        <header style={styles.header}>
          <h1 style={styles.headerH1}>Movie Explorer</h1>
        </header>

        {/* CONTROLS */}
        <div style={styles.controls}>
          <input
            className="me-input"
            type="text"
            placeholder="Search for a movie..."
            autoComplete="off"
            value={query}
            onChange={handleSearchChange}
          />
          <select
            className="me-select"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="">Sort By</option>
            <option value="release_date.asc">Release Date (Asc)</option>
            <option value="release_date.desc">Release Date (Desc)</option>
            <option value="vote_average.asc">Rating (Asc)</option>
            <option value="vote_average.desc">Rating (Desc)</option>
          </select>
        </div>

        {/* MAIN GRID */}
        <main style={styles.main}>
          <div style={styles.movieGrid}>
            {loading ? (
              Array.from({ length: 20 }, (_, i) => <SkeletonCard key={i} />)
            ) : error ? (
              <div style={styles.emptyState}>
                <h3 style={styles.emptyH3}>Something went wrong</h3>
                <p style={styles.emptyP}>{error}</p>
              </div>
            ) : movies.length === 0 ? (
              <div style={styles.emptyState}>
                <h3 style={styles.emptyH3}>No results found</h3>
                <p style={styles.emptyP}>
                  {debouncedQuery
                    ? `Nothing matched "${debouncedQuery}". Try a different title.`
                    : "Try adjusting your filters."}
                </p>
              </div>
            ) : (
              movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
            )}
          </div>
        </main>

        {/* FOOTER / PAGINATION */}
        <footer style={styles.footer}>
          <div style={styles.pagination}>
            <button
              className="me-page-btn"
              onClick={goToPrev}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <span style={styles.pageLabel}>
              Page {page} of {totalPages}
            </span>
            <button
              className="me-page-btn"
              onClick={goToNext}
              disabled={page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ─── STYLES (JS) ───────────────────────────────────────── */
const styles = {
  app: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: "#f0f2f5",
    color: "#222",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#2d3e50",
    padding: "36px 20px 30px",
    textAlign: "center",
  },
  headerH1: {
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: "24px 20px 20px",
    flexWrap: "wrap",
  },
  main: {
    flex: 1,
    padding: "10px 20px 24px",
    maxWidth: 1600,
    width: "100%",
    margin: "0 auto",
  },
  movieGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 24,
  },
  movieCard: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  posterWrap: {
    aspectRatio: "2 / 3",
    overflow: "hidden",
    background: "#dde2ea",
    flexShrink: 0,
    margin: "12px auto 0",
    width: "calc(100% - 24px)",
    borderRadius: 8,
  },
  posterImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  posterPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cardInfo: {
    padding: "14px 16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
    lineHeight: 1.35,
    textAlign: "center",
  },
  cardMeta: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "80px 20px",
    color: "#777",
  },
  emptyH3: { fontSize: 22, marginBottom: 8, color: "#444" },
  emptyP: { fontSize: 15 },
  footer: {
    padding: "18px 20px 24px",
    textAlign: "center",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  pageLabel: {
    fontSize: 16,
    fontWeight: 500,
    color: "#333",
    minWidth: 120,
    textAlign: "center",
  },
  // Skeleton
  skeletonCard: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,0.09)",
    overflow: "hidden",
  },
  skeletonPoster: {
    aspectRatio: "2 / 3",
    background:
      "linear-gradient(90deg, #e8eaed 25%, #f5f5f5 50%, #e8eaed 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  },
  skeletonInfo: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
  skeletonLine: {
    height: 13,
    borderRadius: 4,
    background:
      "linear-gradient(90deg, #e8eaed 25%, #f5f5f5 50%, #e8eaed 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  },
};

/* ─── CSS (for pseudo-states & keyframes) ───────────────── */
const cssText = `
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .me-input {
    padding: 11px 18px;
    font-size: 15px;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 280px;
    outline: none;
    background: #fff;
    color: #222;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .me-input::placeholder { color: #999; }
  .me-input:focus {
    border-color: #4a90d9;
    box-shadow: 0 0 0 3px rgba(74,144,217,0.18);
  }
  .me-select {
    padding: 11px 16px;
    font-size: 15px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    color: #222;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .me-select:focus {
    border-color: #4a90d9;
    box-shadow: 0 0 0 3px rgba(74,144,217,0.18);
  }
  .me-page-btn {
    padding: 10px 28px;
    font-size: 15px;
    font-weight: 600;
    background: #4a90d9;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
  }
  .me-page-btn:hover:not(:disabled) {
    background: #357abd;
    transform: translateY(-1px);
  }
  .me-page-btn:disabled {
    background: #b0c4de;
    cursor: not-allowed;
  }
  @media (max-width: 600px) {
    .me-input { width: 100%; }
  }
`;
