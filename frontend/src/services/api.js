import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 300000, // 5 minutes (increased for multi-page scraping)
});

export async function checkAuthStatus() {
    const res = await api.get('/auth/status');
    return res.data;
}

export async function authLogin() {
    const res = await api.post('/auth/login');
    return res.data;
}

export async function scrapeProfile(url, fresh = false, maxPosts = 10) {
    const res = await api.get('/scrape/profile', {
        params: { url, fresh: fresh ? 'true' : undefined, maxPosts },
    });
    return res.data;
}

export async function scrapePosts(url, max = 20) {
    const res = await api.get('/scrape/posts', { params: { url, max } });
    return res.data;
}

export async function scrapeImages(url) {
    const res = await api.get('/scrape/images', { params: { url } });
    return res.data;
}

export async function scrapeComplete(url) {
    const res = await api.get('/scrape/complete', { params: { url } });
    return res.data;
}

export default api;
