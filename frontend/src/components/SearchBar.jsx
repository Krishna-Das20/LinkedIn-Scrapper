import { useState } from 'react';
import './SearchBar.css';

export default function SearchBar({ onScrape, isLoading }) {
    const [url, setUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim() && !isLoading) {
            onScrape(url.trim());
        }
    };

    return (
        <form className="search-bar glass-card" onSubmit={handleSubmit}>
            <div className="search-bar__icon">🔍</div>
            <input
                type="text"
                className="search-bar__input"
                placeholder="Paste LinkedIn profile URL or username..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
            />
            <button
                type="submit"
                className="search-bar__btn"
                disabled={!url.trim() || isLoading}
            >
                {isLoading ? (
                    <span className="search-bar__spinner" />
                ) : (
                    'Scrape'
                )}
            </button>
        </form>
    );
}
