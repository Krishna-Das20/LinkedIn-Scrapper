import './DataSections.css';

// Simple inline SVGs for cleaner look without dependencies
const Icons = {
    Experience: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
    Education: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>,
    Skills: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
    Posts: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    Recommendations: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>,
    Certifications: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
    Contact: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
    Accomplishments: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>,
    Gallery: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
};

/* ─── Experience Timeline ─── */
export function ExperienceTimeline({ experience }) {
    if (!experience || experience.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Experience /></span> Experience</h3>
            <div className="timeline stagger">
                {experience.map((exp, i) => (
                    <div key={i} className="timeline__item">
                        <div className="timeline__dot" />
                        <div className="timeline__content">
                            <div className="timeline__header">
                                {exp.companyLogo && <img className="timeline__logo" src={exp.companyLogo} alt="" />}
                                <div className="timeline__info">
                                    <h4 className="timeline__title">{exp.title || 'Untitled Role'}</h4>
                                    <p className="timeline__company">{exp.company}{exp.type ? <span className="timeline__type"> · {exp.type}</span> : ''}</p>
                                    <div className="timeline__meta">
                                        {exp.dateRange && <span className="timeline__date">{exp.dateRange}</span>}
                                        {exp.duration && <span className="timeline__duration"> · {exp.duration}</span>}
                                        {exp.location && <span className="timeline__location"> · {exp.location}</span>}
                                    </div>
                                </div>
                            </div>
                            {exp.description && <p className="timeline__desc">{exp.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Education Section ─── */
export function EducationSection({ education }) {
    if (!education || education.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Education /></span> Education</h3>
            <div className="stagger">
                {education.map((edu, i) => (
                    <div key={i} className="data-item">
                        <div className="data-item__header">
                            {edu.schoolLogo && <img className="data-item__logo" src={edu.schoolLogo} alt="" />}
                            <div className="data-item__info">
                                <h4 className="data-item__title">{edu.school || 'Unknown School'}</h4>
                                {edu.degree && <p className="data-item__subtitle">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>}
                                {edu.dates && <p className="data-item__meta">{edu.dates}</p>}
                            </div>
                        </div>
                        {edu.grade && <p className="data-item__detail"><strong>Grade:</strong> {edu.grade}</p>}
                        {edu.activities && <p className="data-item__detail"><strong>Activities:</strong> {edu.activities}</p>}
                        {edu.description && <p className="data-item__desc">{edu.description}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Skills Grid ─── */
export function SkillsGrid({ skills }) {
    if (!skills || skills.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Skills /></span> Skills</h3>
            <div className="skills-grid">
                {skills.map((skill, i) => (
                    <div key={i} className="skill-tag">
                        <span>{skill.name}</span>
                        {skill.endorsements != null && <span className="skill-tag__count">{skill.endorsements}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Posts Feed ─── */
export function PostsFeed({ posts }) {
    if (!posts || posts.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Posts /></span> Recent Posts</h3>
            <div className="posts-feed stagger">
                {posts.map((post, i) => (
                    <div key={i} className="post-card">
                        <div className="post-card__header">
                            {post.type && <span className="badge badge--purple">{post.type}</span>}
                            {post.date && <span className="post-card__date">{post.date}</span>}
                        </div>
                        {post.text && <p className="post-card__text">{post.text.length > 300 ? post.text.slice(0, 300) + '...' : post.text}</p>}
                        {post.images && post.images.length > 0 && (
                            <div className="post-card__images">
                                {post.images.slice(0, 4).map((img, j) => (
                                    <img key={j} src={img} alt={`Post image ${j + 1}`} className="post-card__img" />
                                ))}
                            </div>
                        )}
                        <div className="post-card__metrics">
                            {post.reactions && <span>❤️ {post.reactions}</span>}
                            {post.comments && <span>💬 {post.comments}</span>}
                            {post.reposts && <span>🔁 {post.reposts}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Recommendations ─── */
export function RecommendationsSection({ recommendations }) {
    if (!recommendations) return null;
    const received = recommendations.received || [];
    const given = recommendations.given || [];
    if (received.length === 0 && given.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Recommendations /></span> Recommendations</h3>
            {received.length > 0 && (
                <>
                    <p className="subsection-title">Received ({received.length})</p>
                    {received.map((rec, i) => (
                        <div key={i} className="rec-card">
                            <div className="rec-card__header">
                                {rec.photo && <img className="rec-card__photo" src={rec.photo} alt="" />}
                                <div>
                                    <strong className="rec-card__name">{rec.name}</strong>
                                    {rec.title && <p className="rec-card__title">{rec.title}</p>}
                                </div>
                            </div>
                            {rec.text && <div className="rec-card__text">"{rec.text}"</div>}
                        </div>
                    ))}
                </>
            )}
            {given.length > 0 && (
                <>
                    <p className="subsection-title" style={{ marginTop: '1.5rem' }}>Given ({given.length})</p>
                    {given.map((rec, i) => (
                        <div key={`g-${i}`} className="rec-card">
                            <strong className="rec-card__name">{rec.name}</strong>
                            {rec.text && <div className="rec-card__text">"{rec.text}"</div>}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

/* ─── Certifications ─── */
export function CertificationsSection({ certifications }) {
    if (!certifications || certifications.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Certifications /></span> Certifications</h3>
            <div className="stagger">
                {certifications.map((cert, i) => (
                    <div key={i} className="data-item">
                        <div className="data-item__header">
                            {cert.logo && <img className="data-item__logo" src={cert.logo} alt="" />}
                            <div className="data-item__info">
                                <h4 className="data-item__title">{cert.name}</h4>
                                {cert.issuingOrganization && <p className="data-item__subtitle">{cert.issuingOrganization}</p>}
                                <div className="data-item__meta">
                                    {cert.issueDate && <span>Issued {cert.issueDate}</span>}
                                    {cert.credentialId && <span> • ID: {cert.credentialId}</span>}
                                </div>
                            </div>
                        </div>
                        {cert.credentialUrl && (
                            <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="data-item__link">Show credential →</a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Contact Info ─── */
export function ContactInfo({ contact }) {
    if (!contact) return null;
    const hasData = contact.email || contact.phone || contact.websites?.length > 0;
    if (!hasData) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Contact /></span> Contact Info</h3>
            <div className="contact-grid">
                {contact.email && <div className="contact-item"><span className="contact-item__label">Email</span><span>{contact.email}</span></div>}
                {contact.phone && <div className="contact-item"><span className="contact-item__label">Phone</span><span>{contact.phone}</span></div>}
                {contact.twitter && <div className="contact-item"><span className="contact-item__label">Twitter</span><span>{contact.twitter}</span></div>}
                {contact.birthday && <div className="contact-item"><span className="contact-item__label">Birthday</span><span>{contact.birthday}</span></div>}
                {contact.connectedDate && <div className="contact-item"><span className="contact-item__label">Connected</span><span>{contact.connectedDate}</span></div>}
                {contact.address && <div className="contact-item"><span className="contact-item__label">Address</span><span>{contact.address}</span></div>}
                {contact.websites?.map((w, i) => (
                    <div key={i} className="contact-item">
                        <span className="contact-item__label">{w.label}</span>
                        <a href={w.url} target="_blank" rel="noreferrer">{w.url}</a>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Accomplishments ─── */
export function AccomplishmentsSection({ accomplishments }) {
    if (!accomplishments) return null;

    const sections = [
        { key: 'languages', title: 'Languages', render: (l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}` },
        { key: 'honors', title: 'Honors & Awards', render: (h) => `${h.title}${h.issuer ? ` — ${h.issuer}` : ''}${h.date ? ` (${h.date})` : ''}` },
        { key: 'volunteer', title: 'Volunteer', render: (v) => `${v.role}${v.organization ? ` at ${v.organization}` : ''}` },
        { key: 'publications', title: 'Publications', render: (p) => `${p.title}${p.publisher ? ` — ${p.publisher}` : ''}` },
        { key: 'projects', title: 'Projects', render: (p) => p.name },
        { key: 'courses', title: 'Courses', render: (c) => `${c.name}${c.number ? ` (${c.number})` : ''}` },
        { key: 'organizations', title: 'Organizations', render: (o) => `${o.name}${o.position ? ` — ${o.position}` : ''}` },
    ];

    const hasSomething = sections.some(s => accomplishments[s.key]?.length > 0);
    if (!hasSomething) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Accomplishments /></span> Accomplishments</h3>
            <div className="accomplishments-grid">
                {sections.map(s => {
                    const items = accomplishments[s.key];
                    if (!items || items.length === 0) return null;
                    return (
                        <div key={s.key} className="accomplishment-group">
                            <h4 className="accomplishment-group__title">{s.title}</h4>
                            <ul className="accomplishment-group__list">
                                {items.map((item, i) => (
                                    <li key={i}>{s.render(item)}</li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Image Gallery ─── */
export function ImageGallery({ images }) {
    if (!images || images.allUrls?.length === 0) return null;

    return (
        <div className="glass-card data-section fade-in">
            <h3 className="section-title"><span className="icon-wrap"><Icons.Gallery /></span> All Images ({images.allUrls.length})</h3>
            <div className="image-gallery">
                {images.allUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="image-gallery__item">
                        <img src={url} alt={`Image ${i + 1}`} loading="lazy" />
                    </a>
                ))}
            </div>
        </div>
    );
}

/* ─── Loading Skeleton ─── */
export function LoadingState() {
    return (
        <div className="loading-state">
            <div className="skeleton-header glass-card">
                <div className="skeleton-banner" />
                <div className="skeleton-avatar-row">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-info">
                        <div className="skeleton-line lg" />
                        <div className="skeleton-line md" />
                        <div className="skeleton-line sm" />
                    </div>
                </div>
            </div>
            {[1, 2, 3].map(i => (
                <div key={i} className="glass-card skeleton-section" />
            ))}
            <p className="loading-text">
                ⏳ Scraping profile... This may take 30-60 seconds.
            </p>
        </div>
    );
}
