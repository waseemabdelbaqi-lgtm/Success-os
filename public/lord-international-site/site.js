(function () {
  const page = document.body.dataset.page || 'home';

  const links = [
    { href: 'index.html', id: 'home', label: 'Home' },
    { href: 'about.html', id: 'about', label: 'About Us' },
    { href: 'vision.html', id: 'vision', label: 'Our Vision' },
    { href: 'mission.html', id: 'mission', label: 'Our Mission' },
    { href: 'teachers.html', id: 'teachers', label: 'Teachers' },
    { href: 'administrators.html', id: 'administrators', label: 'Administrators' },
    { href: 'location.html', id: 'location', label: 'Our Location' },
    { href: 'contact.html', id: 'contact', label: 'Contact Us' },
  ];

  const top = document.getElementById('site-top');
  if (top) {
    top.innerHTML = `
      <div class="shell topbar-inner">
        <span>Tla’ Al-Ali, Amman · +962 7 8058 1111</span>
        <div class="top-actions">
          <div class="lang" aria-label="Language">
            <a class="on" href="index.html">EN</a>
            <a href="ar/index.html">AR</a>
          </div>
          <a href="https://lordsacademy.k12net.com" target="_blank" rel="noopener noreferrer">School Portal</a>
          <a href="login.html">Login</a>
        </div>
      </div>`;
  }

  const header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = `
      <div class="shell header-row">
        <a class="brand" href="index.html" aria-label="Lords International Academy home">
          <img src="assets/logo.png" alt="Lords International Academy logo" width="64" height="64" />
          <span class="brand-copy">
            <strong>LORDS</strong>
            <span>International Academy</span>
          </span>
        </a>
        <nav class="nav" id="navLinks" aria-label="Primary">
          ${links
            .map((l) => `<a href="${l.href}" class="${page === l.id ? 'active' : ''}">${l.label}</a>`)
            .join('')}
        </nav>
        <div class="header-cta">
          <a class="btn btn-orange" href="contact.html">Register Interest</a>
          <button type="button" class="menu-btn" id="menuBtn" aria-expanded="false" aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>`;

    const btn = document.getElementById('menuBtn');
    const nav = document.getElementById('navLinks');
    btn?.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `
      <div class="shell">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="assets/logo.png" alt="Lords International Academy" width="72" height="72" />
            <strong>Lords International Academy</strong>
            <p>Boys &amp; girls international pathways in Tla’ Al-Ali, Amman — clear identity, disciplined growth, and family-ready communication.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><a href="about.html">About Us</a></li>
              <li><a href="vision.html">Our Vision</a></li>
              <li><a href="mission.html">Our Mission</a></li>
              <li><a href="teachers.html">Teachers</a></li>
            </ul>
          </div>
          <div>
            <h4>Campus</h4>
            <ul>
              <li><a href="administrators.html">Administrators</a></li>
              <li><a href="location.html">Our Location</a></li>
              <li><a href="contact.html">Contact Us</a></li>
              <li><a href="login.html">Login</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>+962 7 8058 1111</li>
              <li>Tla’ Al-Ali, Amman</li>
              <li><a href="https://lordsacademy.k12net.com" target="_blank" rel="noopener noreferrer">lordsacademy.k12net.com</a></li>
              <li>Strategic partner: Success 4 Sure</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Lords International Academy</span>
          <span>International division digital experience</span>
        </div>
      </div>`;
  }
})();
