(function () {
  const page = document.body.dataset.page || 'home';
  const onHero = document.body.dataset.hero === 'true';

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

  const util = document.getElementById('site-util');
  if (util) {
    util.innerHTML = `
      <div class="shell util-inner">
        <div class="util-links">
          <span>Omareyah International Division · Amman, Jordan</span>
        </div>
        <div class="util-links">
          <div class="lang-switch" aria-label="Language">
            <a class="active" href="#" data-lang="en">EN</a>
            <a href="ar/index.html" data-lang="ar">AR</a>
          </div>
          <a href="login.html">Parent / Staff Login</a>
        </div>
      </div>`;
  }

  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header' + (onHero ? ' on-hero' : '');
    header.innerHTML = `
      <div class="shell nav-row">
        <a class="brand" href="index.html" aria-label="Omareyah International home">
          <img class="brand-lockup" src="assets/logo-lockup.svg" alt="Omareyah International" height="46" />
          <img class="brand-lockup-light" src="assets/logo-lockup-light.svg" alt="Omareyah International" height="46" />
        </a>
        <nav class="nav-links" id="navLinks" aria-label="Primary">
          ${links
            .map(
              (l) =>
                `<a href="${l.href}" class="${page === l.id ? 'active' : ''}">${l.label}</a>`
            )
            .join('')}
        </nav>
        <div class="nav-actions">
          <a class="btn-login" href="login.html">Login</a>
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
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `
      <div class="shell">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="assets/logo-lockup-light.svg" alt="Omareyah International" height="42" />
            <p>A distinct international division of Omareyah Schools — built for global pathways, clear identity, and quiet excellence.</p>
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
            <h4>Note</h4>
            <ul>
              <li>Proposed International Division identity</li>
              <li>Strategic partner: Success 4 Sure</li>
              <li>Does not replace the national Omareyah site</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Omareyah International Division</span>
          <span>Independent design from the national school website</span>
        </div>
      </div>`;
  }
})();
