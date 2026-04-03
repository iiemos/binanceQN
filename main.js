window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => loader.classList.add('hidden'), 350);
    }
});

window.addEventListener('scroll', () => {
    const progress = document.getElementById('scrollProgress');
    if (progress) {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
        progress.style.width = `${pct}%`;
    }

    const nav = document.getElementById('navbar');
    if (nav) {
        nav.classList.toggle('scrolled', window.scrollY > 30);
    }
});

function toggleMobileMenu() {
    const links = document.querySelector('.nav-links');
    if (links) {
        links.classList.toggle('open');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
}

window.toggleMobileMenu = toggleMobileMenu;
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', () => {
    const yearNode = document.getElementById('footerYear');
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
});
