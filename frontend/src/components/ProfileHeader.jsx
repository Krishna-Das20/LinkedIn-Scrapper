import './ProfileHeader.css';

const Icons = {
    MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    Users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    Link: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
    Info: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
};

export default function ProfileHeader({ profile }) {
    if (!profile) return null;

    return (
        <div className="profile-header glass-card fade-in">
            {/* Banner Section */}
            <div className="profile-header__banner-container">
                {profile.bannerImage ? (
                    <img className="profile-header__banner" src={profile.bannerImage} alt="Banner" />
                ) : (
                    <div className="profile-header__banner profile-header__banner--placeholder" />
                )}
            </div>

            <div className="profile-header__content">
                {/* Avatar Row */}
                <div className="profile-header__top-row">
                    <div className="profile-header__avatar-wrap">
                        {profile.profileImage ? (
                            <img className="profile-header__avatar" src={profile.profileImage} alt={profile.name} />
                        ) : (
                            <div className="profile-header__avatar profile-header__avatar--placeholder">
                                {profile.name?.[0] || '?'}
                            </div>
                        )}
                        {profile.openToWork && <span className="otw-badge">#OpenToWork</span>}
                    </div>
                </div>

                {/* Info Section */}
                <div className="profile-header__info">
                    <div className="profile-header__main">
                        <h1 className="profile-header__name">{profile.name || 'Unknown User'}</h1>
                        {profile.headline && <p className="profile-header__headline">{profile.headline}</p>}
                    </div>

                    <div className="profile-header__meta">
                        {profile.location && (
                            <span className="meta-item">
                                <Icons.MapPin /> {profile.location}
                            </span>
                        )}
                        {profile.followers && (
                            <span className="meta-item">
                                <Icons.Users /> {profile.followers} followers
                            </span>
                        )}
                        {profile.connections && (
                            <span className="meta-item">
                                <Icons.Link /> {profile.connections} connections
                            </span>
                        )}
                    </div>
                </div>

                {/* About Section (Inline) */}
                {profile.about && (
                    <div className="profile-header__about">
                        <h3 className="section-label"><Icons.Info /> About</h3>
                        <p className="about-text">{profile.about}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
