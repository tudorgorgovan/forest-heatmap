document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('main-header');
    if (!headerContainer) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    headerContainer.innerHTML = `
        <header class="app-header">
            <div class="container header-container">
                <a href="index.html" class="logo-link">
                    <img src="assets/Poza_logo.jpeg" alt="LoveLinux++ Logo" class="header-logo">
                    <span class="header-title">Harta Transporturilor</span>
                </a>
                
                <nav class="main-nav">
                    <ul>
                        <li><a href="index.html" class="${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">Introducere</a></li>
                        <li><a href="map.html" class="${currentPage === 'map.html' ? 'active' : ''}">Hartă</a></li>
                    </ul>
                </nav>
                
                <div class="mobile-toggle">
                    <i class="fa-solid fa-bars"></i>
                </div>
            </div>
        </header>
    `;

    // logica pentru meniul mobil
    const toggle = headerContainer.querySelector('.mobile-toggle');
    const nav = headerContainer.querySelector('.main-nav');

    if (toggle) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            toggle.innerHTML = nav.classList.contains('open') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });
    }
});
