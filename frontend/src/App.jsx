import { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import ProfileHeader from './components/ProfileHeader';
import {
    ExperienceTimeline,
    EducationSection,
    SkillsGrid,
    PostsFeed,
    RecommendationsSection,
    CertificationsSection,
    ContactInfo,
    AccomplishmentsSection,
    ImageGallery,
    LoadingState,
} from './components/DataSections';
import { checkAuthStatus, authLogin, scrapeProfile } from './services/api';

export default function App() {
    const [authStatus, setAuthStatus] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [scrapedData, setScrapedData] = useState(null);
    const [error, setError] = useState(null);

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus()
            .then((res) => setAuthStatus(res))
            .catch(() => setAuthStatus({ valid: false, message: 'Backend not reachable' }));
    }, []);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            console.log('Attempting login...', authLogin);
            await authLogin();
            const status = await checkAuthStatus();
            setAuthStatus(status);
        } catch (err) {
            console.error('Login error:', err);
            setAuthStatus({ valid: false, message: err.response?.data?.error || 'Login failed' });
        }
        setIsLoggingIn(false);
    };

    const handleScrape = async (url) => {
        setIsLoading(true);
        setError(null);
        setScrapedData(null);
        try {
            const res = await scrapeProfile(url);
            setScrapedData(res.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Scraping failed');
        }
        setIsLoading(false);
    };

    const handleExport = () => {
        if (!scrapedData) return;
        const blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkedin-${scrapedData.profile?.name?.replace(/\s+/g, '_') || 'profile'}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>LinkedIn Profile Scraper</h1>
                <p>Extract complete profile data using Playwright</p>
            </header>

            {/* Auth Status */}
            {authStatus && (
                <div className={`auth-bar ${authStatus.valid ? 'auth-bar--valid' : 'auth-bar--invalid'}`}>
                    <span>{authStatus.valid ? '✅' : '⚠️'} {authStatus.message}</span>
                    {!authStatus.valid && (
                        <button onClick={handleLogin} disabled={isLoggingIn}>
                            {isLoggingIn ? 'Logging in...' : 'Login to LinkedIn'}
                        </button>
                    )}
                </div>
            )}

            {/* Search Bar */}
            <SearchBar onScrape={handleScrape} isLoading={isLoading} />

            {/* Error */}
            {error && (
                <div className="error-display fade-in">
                    <p>❌ {error}</p>
                </div>
            )}

            {/* Loading */}
            {isLoading && <LoadingState />}

            {/* Results */}
            {scrapedData && !isLoading && (
                <div className="results fade-in">
                    {/* Meta + Export */}
                    <div className="glass-card results-meta">
                        <div>
                            <span className="text-muted text-sm">
                                Scraped in {scrapedData.meta?.durationMs ? `${(scrapedData.meta.durationMs / 1000).toFixed(1)}s` : '—'}
                                {scrapedData.meta?.fromCache && ' (from cache)'}
                            </span>
                        </div>
                        <button className="export-btn" onClick={handleExport}>
                            📥 Export JSON
                        </button>
                    </div>

                    <ProfileHeader profile={scrapedData.profile} />
                    <ExperienceTimeline experience={scrapedData.experience} />
                    <EducationSection education={scrapedData.education} />
                    <SkillsGrid skills={scrapedData.skills} />
                    <PostsFeed posts={scrapedData.posts} />
                    <RecommendationsSection recommendations={scrapedData.recommendations} />
                    <CertificationsSection certifications={scrapedData.certifications} />
                    <ContactInfo contact={scrapedData.contact} />
                    <AccomplishmentsSection accomplishments={scrapedData.accomplishments} />
                    <ImageGallery images={scrapedData.images} />
                </div>
            )}
        </div>
    );
}
