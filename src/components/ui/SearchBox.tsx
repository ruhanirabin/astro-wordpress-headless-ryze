import { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";

interface SearchPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  categories: string[];
}

interface Props {
  searchIndex: SearchPost[];
}

export default function SearchBox({ searchIndex }: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: [
          { name: "title", weight: 2 },
          { name: "excerpt", weight: 1 },
          { name: "categories", weight: 1.5 },
        ],
        threshold: 0.3,
        includeScore: true,
      }),
    [searchIndex]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 8);
  }, [query, fuse]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            window.location.href = `/${results[selectedIndex].item.slug}`;
          }
          break;
        case "Escape":
          setIsOpen(false);
          setQuery("");
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full sm:w-40 md:w-48 max-w-[90vw] h-12 px-3 text-sm rounded-lg border border-foreground/20 bg-background/50 backdrop-blur-sm focus:ring-2 focus:ring-accent focus:border-transparent focus:outline-none transition-all placeholder:text-foreground/50"
          aria-label="Search posts"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-results"
          role="combobox"
          aria-autocomplete="list"
        />
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim() && (
        <div
          id="search-results"
          role="listbox"
          className="absolute right-0 top-full mt-2 w-[min(20rem,90vw)] max-h-96 overflow-y-auto bg-background border border-foreground/20 rounded-lg shadow-xl z-50"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-foreground/60 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="py-2">
              {results.map(({ item }, index) => (
                <li key={item.id}>
                  <a
                    href={`/${item.slug}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`block px-4 py-3 transition-colors ${
                      index === selectedIndex
                        ? "bg-accent/20"
                        : "hover:bg-foreground/5"
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <h4 className="font-medium text-foreground text-sm line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
                      {item.excerpt}...
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-foreground/40">
                        {formatDate(item.date)}
                      </span>
                      {item.categories.length > 0 && (
                        <>
                          <span className="text-foreground/30">•</span>
                          <div className="flex gap-1 flex-wrap">
                            {item.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 border-t border-foreground/10 text-xs text-foreground/40">
            Press <kbd className="px-1 py-0.5 bg-foreground/10 rounded">↑</kbd>{" "}
            <kbd className="px-1 py-0.5 bg-foreground/10 rounded">↓</kbd> to
            navigate,{" "}
            <kbd className="px-1 py-0.5 bg-foreground/10 rounded">Enter</kbd> to
            select
          </div>
        </div>
      )}
    </div>
  );
}
