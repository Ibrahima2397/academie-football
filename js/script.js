// Configuration de l'API
const API_URL = window.ACADEMIE_API_URL
    || `${window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin}/api`;
const AUTH_TOKEN_KEY = 'authToken';

function authHeaders() {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Menu hamburger et navigation responsive
document.addEventListener('DOMContentLoaded', () => {
    initGalleryMediaPage();
    initLiveGalleryPage();

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu?.querySelectorAll('a');
    const dropdowns = navMenu?.querySelectorAll('.dropdown');
    
    // Toggle menu hamburger
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Fermer le menu quand on clique sur un lien (sauf sur le parent dropdown)
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.parentElement.classList.contains('dropdown')) {
                    // Si c'est le lien principal d'un dropdown sur mobile
                    if (window.innerWidth < 1024) {
                        e.preventDefault();
                        link.parentElement.classList.toggle('active');
                    }
                } else {
                    if (hamburger) hamburger.classList.remove('active');
                    if (navMenu) navMenu.classList.remove('active');
                }
            });
        });
        
        // Fermer le menu quand on clique en dehors
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.querySelectorAll('.notif-panel, .lang-dropdown').forEach(el => el.classList.remove('active'));
            }
        });
        
        // Ajuster la navigation au redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                dropdowns?.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    // Gestion des Notifications
    const notifBtn = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    if (notifBtn && notifPanel) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle('active');
            const langDropdown = document.getElementById('langDropdown');
            if (langDropdown) langDropdown.classList.remove('active');
        });
    }

    // Gestion de la Langue (Français / English)
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    if (langBtn && langDropdown) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
            if (notifPanel) notifPanel.classList.remove('active');
        });
    }

    // Recherche Globale
    const searchInputs = document.querySelectorAll('.search-container input');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    showAlert(`Recherche pour: "${query}"...`, 'success');
                    const isSubfolder = window.location.pathname.includes('/html/');
                    const targetPage = isSubfolder ? 'actualites.html' : 'html/actualites.html';
                    window.location.href = `${targetPage}?q=${encodeURIComponent(query)}`;
                }
            }
        });
    });

    // Restaurer la langue enregistrée
    const savedLang = localStorage.getItem('lang') || 'fr';
    if (savedLang === 'en') {
        switchLanguage('en', false);
    }
});

// Dictionnaire de traduction FR / EN
const translations = {
    fr: {
        searchPlaceholder: "Rechercher...",
        loginBtn: "Connexion",
        signupBtn: "Inscription",
        notifTitle: "Alertes & Notifications",
        notifMatchTitle: "Match U17 ce samedi",
        notifMatchDesc: "Victoire 3-1 contre Labé FC au Stade Régional.",
        notifTrainingTitle: "Session de détection",
        notifTrainingDesc: "Inscriptions ouvertes pour la promo 2026.",
        notifPartnerTitle: "Nouveau partenaire",
        notifPartnerDesc: "Bienvenue à notre nouvel équipementier !"
    },
    en: {
        searchPlaceholder: "Search...",
        loginBtn: "Login",
        signupBtn: "Register",
        notifTitle: "Alerts & Notifications",
        notifMatchTitle: "U17 Match this Saturday",
        notifMatchDesc: "3-1 Victory against Labé FC at the Regional Stadium.",
        notifTrainingTitle: "Scouting Session",
        notifTrainingDesc: "Registration open for class of 2026.",
        notifPartnerTitle: "New Partner",
        notifPartnerDesc: "Welcome to our new kit supplier!"
    }
};

function switchLanguage(lang, notify = true) {
    localStorage.setItem('lang', lang);
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    if (langBtn) {
        langBtn.innerHTML = `<i class="fas fa-globe"></i> ${lang.toUpperCase()} <i class="fas fa-chevron-down"></i>`;
    }
    if (langDropdown) langDropdown.classList.remove('active');

    const dict = translations[lang] || translations.fr;

    document.querySelectorAll('.search-container input').forEach(input => {
        input.placeholder = dict.searchPlaceholder;
    });

    if (notify) {
        showAlert(lang === 'fr' ? 'Langue changée en Français 🇫🇷' : 'Language switched to English 🇬🇧', 'success');
    }
}

// Fonction pour afficher les alertes
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background-color: #10b981; color: white;' : 'background-color: #ef4444; color: white;'}
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            alertDiv.remove();
        }, 300);
    }, 3000);
}

// Ajouter les animations CSS pour les alertes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Gestion globale de la navbar de session au chargement
document.addEventListener('DOMContentLoaded', () => {
    // 1. Détection de session
    const authLinksContainer = document.querySelector('.auth-links');
    if (authLinksContainer) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const isSubfolder = window.location.pathname.includes('/html/');
            const dashboardPath = isSubfolder ? 'dashboard.html' : 'html/dashboard.html';
            const firstName = user.fullname.split(' ')[0];
            authLinksContainer.innerHTML = `
                <span class="user-greeting" style="margin-right: 1rem; font-weight: 600; color: #1e3a8a;">Salut, <strong>${firstName}</strong></span>
                <a href="${dashboardPath}" class="auth-btn signup" style="margin-right: 0.5rem;"><i class="fas fa-desktop"></i> Mon Espace</a>
                <button id="logoutBtn" class="auth-btn login" style="cursor: pointer; border: 2px solid #dc2626; color: #dc2626; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 8px;"><i class="fas fa-sign-out-alt"></i></button>
            `;
            
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    const authToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
                    if (authToken) {
                        fetch(`${API_URL}/logout`, {
                            method: 'POST',
                            headers: authHeaders()
                        }).catch((error) => console.error('Échec de la fermeture de session:', error));
                    }
                    sessionStorage.removeItem(AUTH_TOKEN_KEY);
                    localStorage.removeItem('user');
                    showAlert('Déconnexion réussie ! Redirection...', 'success');
                    setTimeout(() => {
                        window.location.href = isSubfolder ? '../index.html' : 'index.html';
                    }, 1500);
                });
            }
        }
    }

    // 2. Chargements dynamiques selon la page ouverte
    if (document.querySelector('.equipes-grid')) {
        loadTeams();
    }
    if (document.querySelector('.schedule')) {
        loadTrainings();
    }
    if (document.querySelector('.programmes-grid')) {
        loadCategories();
    }
});

// Fonctions de chargement dynamique
async function loadTeams() {
    const grid = document.querySelector('.equipes-grid');
    if (!grid) return;

    try {
        const res = await fetch(`${API_URL}/teams`);
        if (!res.ok) throw new Error();
        const teams = await res.json();
        
        if (teams.length > 0) {
            grid.innerHTML = '';
            teams.forEach(team => {
                const card = document.createElement('div');
                card.className = 'equipe-card';
                card.innerHTML = `
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(team.coach_name || 'Coach')}&background=f59e0b&color=fff&size=128" alt="Coach ${team.coach_name}" class="coach-photo">
                    <div class="equipe-info">
                        <h3>${team.name}</h3>
                        <p><strong>Entraîneur:</strong> ${team.coach_name || 'Non assigné'}</p>
                        <p><strong>Catégorie:</strong> ${team.category_name || 'Non spécifiée'}</p>
                        <p><strong>Joueurs:</strong> ${team.player_count}</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) {
        console.log('Utilisation des données statiques pour les équipes (serveur hors ligne).');
    }
}

async function loadTrainings() {
    const status = document.querySelector('[data-training-status]');
    const scheduleDiv = status?.previousElementSibling;
    if (!status || !scheduleDiv?.classList.contains('schedule')) return;

    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const legacyLocations = {
        'Terrain Sud': 'Terrain de Fadi',
        'Terrain Nord': 'Terrain de Tata',
        'Terrain Principal': 'Grand Stade Régional de Labé'
    };
    const fallbackTrainings = [
        { day_of_week: 'Lundi', start_time: '10h00', end_time: '12h00', team_name: 'U17 Régional', location: 'Terrain de Fadi' },
        { day_of_week: 'Lundi', start_time: '16h30', end_time: '18h30', team_name: 'Seniors D1', location: 'Terrain de Tata' },
        { day_of_week: 'Lundi', start_time: '19h00', end_time: '20h30', team_name: 'U15 Régional', location: 'Grand Stade Régional de Labé' },
        { day_of_week: 'Mercredi', start_time: '15h00', end_time: '16h00', team_name: 'U17 Régional', location: 'Terrain de Fadi' },
        { day_of_week: 'Mercredi', start_time: '16h30', end_time: '17h30', team_name: 'Seniors D1', location: 'Terrain de Tata' },
        { day_of_week: 'Mercredi', start_time: '18h00', end_time: '19h30', team_name: 'U15 Régional', location: 'Grand Stade Régional de Labé' },
        { day_of_week: 'Vendredi', start_time: '17h00', end_time: '18h00', team_name: 'U17 Régional', location: 'Terrain de Fadi' },
        { day_of_week: 'Vendredi', start_time: '18h30', end_time: '19h30', team_name: 'Seniors D1', location: 'Terrain de Tata' },
        { day_of_week: 'Vendredi', start_time: '20h00', end_time: '21h30', team_name: 'U15 Régional', location: 'Grand Stade Régional de Labé' },
        { day_of_week: 'Samedi', start_time: '09h00', end_time: '11h00', team_name: 'Matchs', location: 'Grand Stade Régional de Labé' },
        { day_of_week: 'Samedi', start_time: '14h00', end_time: '16h00', team_name: 'Matchs', location: 'Grand Stade Régional de Labé' }
    ];
    const fallbackActiveDays = new Set(['Lundi', 'Mercredi', 'Vendredi', 'Samedi']);

    const renderSchedule = (trainings, activeDays) => {
        const grouped = new Map(days.map(day => [day, []]));
        trainings.forEach(training => {
            if (grouped.has(training.day_of_week)) grouped.get(training.day_of_week).push(training);
        });

        scheduleDiv.replaceChildren();
        days.forEach(day => {
            const isActive = activeDays.has(day) ? activeDays.get(day) : false;
            const dayCard = document.createElement('article');
            dayCard.className = `schedule-item${isActive ? '' : ' schedule-item-inactive'}`;

            const heading = document.createElement('div');
            heading.className = 'jour';
            heading.textContent = day;
            dayCard.appendChild(heading);

            const details = document.createElement('div');
            details.className = 'details';
            const dayTrainings = isActive ? grouped.get(day) : [];
            if (!dayTrainings.length) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'schedule-day-message';
                emptyMessage.textContent = isActive ? 'Aucun créneau programmé.' : 'Pas d’entraînement prévu ce jour.';
                details.appendChild(emptyMessage);
            } else {
                dayTrainings.forEach(training => {
                    const row = document.createElement('p');
                    const time = document.createElement('strong');
                    time.textContent = `${training.start_time} - ${training.end_time} :`;
                    const team = document.createElement('span');
                    team.className = 'schedule-team-name';
                    team.textContent = training.team_name || 'Entraînement';
                    const rawLocation = training.location || '';
                    const location = legacyLocations[rawLocation] || rawLocation;
                    const destination = `${location.includes('Labé') ? location : `${location}, Labé`}, Guinée`;
                    const directions = document.createElement('a');
                    directions.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                    directions.target = '_blank';
                    directions.rel = 'noopener noreferrer';
                    directions.className = 'terrain-link';
                    directions.title = `Itinéraire vers ${location}`;
                    const marker = document.createElement('i');
                    marker.className = 'fas fa-map-marker-alt';
                    marker.setAttribute('aria-hidden', 'true');
                    directions.append(marker, document.createTextNode(' Itinéraire'));
                    row.append(time, document.createTextNode(' '), team, directions);
                    details.appendChild(row);
                });
            }
            dayCard.appendChild(details);
            scheduleDiv.appendChild(dayCard);
        });
    };

    try {
        const [trainingsResponse, daysResponse] = await Promise.all([
            fetch(`${API_URL}/trainings`),
            fetch(`${API_URL}/training-days`)
        ]);
        if (!trainingsResponse.ok || !daysResponse.ok) {
            throw new Error('Le calendrier des entraînements est indisponible.');
        }
        const [trainings, daySettings] = await Promise.all([
            trainingsResponse.json(),
            daysResponse.json()
        ]);
        const activeDays = new Map(daySettings.map(setting => [setting.day_of_week, Boolean(setting.is_active)]));
        renderSchedule(trainings, activeDays);
        if (status) status.hidden = true;
    } catch (error) {
        renderSchedule(fallbackTrainings, new Map(days.map(day => [day, fallbackActiveDays.has(day)])));
        if (status) {
            status.textContent = 'Aperçu du calendrier affiché. Connectez le serveur pour voir les horaires les plus récents.';
            status.hidden = false;
        }
        console.error('Échec du chargement du calendrier des entraînements:', error);
    }
}

async function loadCategories() {
    const grid = document.querySelector('.programmes-grid');
    if (!grid) return;

    try {
        const res = await fetch(`${API_URL}/categories`);
        if (!res.ok) throw new Error();
        const categories = await res.json();

        if (categories.length > 0) {
            grid.innerHTML = '';
            categories.forEach(cat => {
                const card = document.createElement('div');
                card.className = 'programme-card';
                
                const avatarName = cat.id === 1 ? 'U17' : (cat.id === 2 ? 'SENIORS' : 'U15');
                const bg = cat.id === 1 ? 'f59e0b' : (cat.id === 2 ? '1e3a8a' : 'dc2626');
                const color = cat.id === 2 ? 'f59e0b' : 'ffffff';
                
                let details = '';
                if (cat.id === 1) {
                    details = '<li>2 entraînements par semaine</li><li>Jeux amicaux réguliers</li><li>Formation ludique</li>';
                } else if (cat.id === 2) {
                    details = '<li>3 entraînements par semaine</li><li>Compétitions régionales</li><li>Suivi personnalisé</li>';
                } else {
                    details = '<li>4 entraînements par semaine</li><li>Matchs officiels</li><li>Préparation physique intensive</li>';
                }

                card.innerHTML = `
                    <div class="programme-logo">
                        <img src="https://ui-avatars.com/api/?name=${avatarName}&background=${bg}&color=${color}&size=128&bold=true" alt="Logo ${cat.name}">
                    </div>
                    <h3>${cat.name}</h3>
                    <p>${cat.description}</p>
                    <ul>${details}</ul>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) {
        console.log('Utilisation des données statiques pour les programmes.');
    }
}

// Gestion du formulaire de contact
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const phone = this.querySelector('input[type="tel"]').value;
        const category = this.querySelector('select').value;
        const message = this.querySelector('textarea').value;

        try {
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, category, message })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Merci pour votre message ! Nous vous recontacterons bientôt.', 'success');
                this.reset();
            } else {
                showAlert(data.message || 'Erreur lors de l\'envoi du message.', 'error');
            }
        } catch (error) {
            showAlert('Erreur de connexion au serveur. Vérifiez que le backend est démarré.', 'error');
        }
    });
}

// Gestion du formulaire d'inscription
const signupForm = document.querySelector('.auth-page img[src*="logo.png"]')?.closest('.auth-container')?.querySelector('form.auth-form');
if (signupForm && window.location.pathname.includes('inscription.html')) {
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const firstname = document.getElementById('firstname').value;
        const lastname = document.getElementById('lastname').value;
        const fullname = `${firstname} ${lastname}`;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password, role: 'player' })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Inscription réussie ! Vous allez être redirigé vers la connexion.', 'success');
                setTimeout(() => {
                    window.location.href = 'connexion.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Erreur lors de l\'inscription.', 'error');
            }
        } catch (error) {
            showAlert('Erreur de connexion au serveur. Vérifiez que le backend est démarré.', 'error');
        }
    });
}

// Gestion du formulaire de connexion
const loginForm = document.querySelector('.auth-page img[src*="logo.png"]')?.closest('.auth-container')?.querySelector('form.auth-form');
if (loginForm && window.location.pathname.includes('connexion.html')) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Connexion réussie ! Bienvenue.', 'success');
                localStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
                const adminLoginRequested = new URLSearchParams(window.location.search).get('redirect') === 'admin';
                if (adminLoginRequested && data.user.role !== 'admin') {
                    showAlert('Ce compte ne possède pas le rôle administrateur.', 'error');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                    return;
                }
                setTimeout(() => {
                    window.location.href = adminLoginRequested ? 'dashboard.html?admin=1' : 'dashboard.html';
                }, 1000);
            } else {
                showAlert(data.message || 'Identifiants invalides.', 'error');
            }
        } catch (error) {
            showAlert('Erreur de connexion au serveur. Vérifiez que le backend est démarré.', 'error');
        }
    });
}

// Animer les éléments au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.programme-card, .equipe-card, .schedule-item').forEach(element => {
    element.style.opacity = '0';
    observer.observe(element);
});

// Initialisation du filtrage par catégorie pour la page Boutique
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('category-tabs')) {
        initCategoryFilter();
    }
});

function initCategoryFilter() {
    const tabs = Array.from(document.querySelectorAll('.category-btn'));
    const cards = Array.from(document.querySelectorAll('.product-card, .player-card'));

    function showCategory(cat) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.category === cat));

        cards.forEach(card => {
            if (cat === 'all' || card.dataset.category === cat) {
                card.style.display = 'flex';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.display = 'none';
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const cat = tab.dataset.category;
            showCategory(cat);
        });
    });

    const active = tabs.find(t => t.classList.contains('active')) || tabs[0];
    if (active) showCategory(active.dataset.category);
}

// Le catalogue prépare une demande de renseignements par e-mail; il ne traite pas de commandes ni de paiements.
function openBuyModal(name, priceStr, desc) {
    let modal = document.getElementById('shopBuyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shopBuyModal';
        modal.className = 'shop-modal-overlay';
        modal.innerHTML = `
            <div class="shop-modal-content" style="max-width: 520px; border-radius: 20px;">
                <button class="shop-modal-close" onclick="closeBuyModal()">&times;</button>
                
                <div style="text-align: center; margin-bottom: 1.25rem;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 0.75rem; box-shadow: 0 6px 16px rgba(30,58,138,0.25);">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <h3 id="modalProdTitle" style="color: #0f172a; font-size: 1.35rem; font-weight: 800; margin-bottom: 0.25rem;"></h3>
                    <p id="modalProdDesc" style="color: #64748b; font-size: 0.9rem; line-height: 1.4;"></p>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span style="color: #475569; font-weight: 600; font-size: 0.95rem;">Prix unitaire:</span>
                        <strong id="modalProdPrice" style="color: #1e3a8a; font-size: 1.15rem;"></strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <label for="buyQty" style="color: #475569; font-weight: 600; font-size: 0.95rem;">Quantité:</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <button onclick="changeModalQty(-1)" style="width: 34px; height: 34px; border: 1px solid #cbd5e1; background: white; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1.1rem; color: #1e3a8a;">-</button>
                            <input type="number" id="buyQty" value="1" min="1" max="99" style="width: 55px; text-align: center; font-weight: 800; border: 1px solid #cbd5e1; border-radius: 8px; padding: 5px; font-size: 1rem; color: #0f172a;" readonly>
                            <button onclick="changeModalQty(1)" style="width: 34px; height: 34px; border: 1px solid #cbd5e1; background: white; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1.1rem; color: #1e3a8a;">+</button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 0.75rem; margin-top: 0.75rem;">
                        <div>
                            <span style="color: #0f172a; font-weight: 700; display: block;">Estimation indicative, non facturée:</span>
                        </div>
                        <strong id="modalProdTotal" style="color: #16a34a; font-size: 1.35rem; font-weight: 800;"></strong>
                    </div>
                </div>

                <div class="shop-form-help" role="note" style="margin-bottom: 1.25rem;">
                    Cette estimation ne constitue pas un prix confirmé. Aucun paiement ni commande n’est effectué sur ce site; les modalités seront à convenir par e-mail.
                </div>

                <fieldset class="shop-delivery-section">
                    <legend><i class="fas fa-truck" aria-hidden="true"></i> Préférence à discuter</legend>
                    <div class="shop-delivery-options" role="group" aria-label="Préférence de réception à discuter">
                        <button type="button" class="shop-delivery-option selected" data-delivery-mode="pickup" aria-pressed="true" onclick="selectDeliveryMode('pickup')">
                            <i class="fas fa-store" aria-hidden="true"></i> Retrait
                        </button>
                        <button type="button" class="shop-delivery-option" data-delivery-mode="delivery" aria-pressed="false" onclick="selectDeliveryMode('delivery')">
                            <i class="fas fa-truck" aria-hidden="true"></i> Livraison
                        </button>
                    </div>
                    <div id="deliveryDetails" class="shop-delivery-details" hidden>
                        <label for="deliveryAddress">Adresse ou quartier de livraison</label>
                        <textarea id="deliveryAddress" rows="2" placeholder="Ex. quartier, rue, repère, ville"></textarea>
                        <span class="delivery-or">ou partagez votre position GPS</span>
                        <button type="button" id="shareLocationBtn" class="share-location-btn" onclick="shareDeliveryLocation()">
                            <i class="fas fa-location-crosshairs" aria-hidden="true"></i> Utiliser ma position actuelle
                        </button>
                        <p id="deliveryLocationStatus" class="delivery-location-status" role="status" aria-live="polite"></p>
                        <a id="deliveryMapLink" class="delivery-map-link" target="_blank" rel="noopener noreferrer" hidden>
                            <i class="fas fa-map-marked-alt" aria-hidden="true"></i> Vérifier le point sur Google Maps
                        </a>
                    </div>
                </fieldset>

                <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                    <button onclick="closeBuyModal()" style="flex: 1; padding: 0.85rem; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; border-radius: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s;">Annuler</button>
                    <button id="submitRequestBtn" onclick="prepareContactRequest()" style="flex: 2; padding: 0.85rem; border: none; background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: white; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 0.95rem;">
                        <i class="fas fa-envelope" style="margin-right: 0.4rem;"></i> Préparer une demande e-mail
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Set product values
    document.getElementById('modalProdTitle').textContent = name;
    document.getElementById('modalProdDesc').textContent = desc || '';
    document.getElementById('modalProdPrice').textContent = priceStr;
    document.getElementById('buyQty').value = 1;
    
    // Parse numeric price for calculation
    const numPrice = parseFloat(priceStr.replace(/[^0-9,.]/g, '').replace(',', '.')) || 35.00;
    window.currentUnitNumPrice = numPrice;
    selectDeliveryMode('pickup');
    window.deliveryCoordinates = null;
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('deliveryLocationStatus').textContent = '';
    document.getElementById('deliveryMapLink').hidden = true;

    updateModalTotals(1);

    modal.classList.add('active');
}

function updateModalTotals(qty) {
    const numPrice = window.currentUnitNumPrice || 35.00;
    const totalEur = (numPrice * qty).toFixed(2);

    const totalElem = document.getElementById('modalProdTotal');
    
    if (totalElem) totalElem.textContent = totalEur + ' €';
}

function changeModalQty(delta) {
    const qtyInput = document.getElementById('buyQty');
    if (!qtyInput) return;
    let qty = parseInt(qtyInput.value) || 1;
    qty = Math.max(1, Math.min(99, qty + delta));
    qtyInput.value = qty;
    updateModalTotals(qty);
}

function closeBuyModal() {
    const modal = document.getElementById('shopBuyModal');
    if (modal) modal.classList.remove('active');
}

function selectDeliveryMode(mode) {
    window.selectedDeliveryMode = mode;
    const deliveryDetails = document.getElementById('deliveryDetails');
    const deliveryModeButtons = document.querySelectorAll('[data-delivery-mode]');

    deliveryDetails.hidden = mode !== 'delivery';
    deliveryModeButtons.forEach((button) => {
        const isSelected = button.dataset.deliveryMode === mode;
        button.classList.toggle('selected', isSelected);
        button.setAttribute('aria-pressed', String(isSelected));
    });
}

function shareDeliveryLocation() {
    const status = document.getElementById('deliveryLocationStatus');
    const mapLink = document.getElementById('deliveryMapLink');

    if (!navigator.geolocation) {
        status.textContent = 'La géolocalisation n’est pas disponible sur cet appareil. Saisissez votre adresse ou votre quartier.';
        return;
    }

    status.textContent = 'Recherche de votre position…';
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
            const latitude = coords.latitude.toFixed(6);
            const longitude = coords.longitude.toFixed(6);
            const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            window.deliveryCoordinates = { latitude, longitude, mapUrl };
            mapLink.href = mapUrl;
            mapLink.hidden = false;
            status.textContent = `Position enregistrée : ${latitude}, ${longitude}. Elle sera incluse dans votre demande de livraison.`;
        },
        (error) => {
            const message = error.code === error.PERMISSION_DENIED
                ? 'Accès à la position refusé. Autorisez la localisation ou saisissez votre adresse.'
                : 'Position indisponible. Réessayez ou saisissez votre adresse ou votre quartier.';
            status.textContent = message;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function prepareContactRequest() {
    const name = document.getElementById('modalProdTitle').textContent;
    const totalEur = document.getElementById('modalProdTotal').textContent;
    const quantity = document.getElementById('buyQty').value;
    const isDelivery = window.selectedDeliveryMode === 'delivery';
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    const coordinates = window.deliveryCoordinates;

    if (isDelivery && !deliveryAddress && !coordinates) {
        document.getElementById('deliveryAddress').focus();
        document.getElementById('deliveryLocationStatus').textContent = 'Pour organiser la livraison, saisissez une adresse ou partagez votre position GPS.';
        return;
    }

    const mapUrl = coordinates?.mapUrl
        || (deliveryAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress)}` : '');
    const deliveryMessage = isDelivery
        ? `Préférence de livraison à discuter\nAdresse/quartier : ${deliveryAddress || 'Non précisé'}\nPosition GPS : ${coordinates ? `${coordinates.latitude}, ${coordinates.longitude}` : 'Non partagée'}\nGoogle Maps : ${mapUrl}`
        : 'Préférence de retrait à discuter';
    const orderMessage = [
        'Bonjour, je souhaite obtenir des renseignements sur cet article :',
        `Article : ${name}`,
        `Quantité : ${quantity}`,
        `Prix indicatif affiché : ${totalEur}, à confirmer`,
        deliveryMessage
    ].join('\n');
    const subject = `Demande de renseignements - ${name}`;
    const mailto = `mailto:contact@academiefady.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(orderMessage)}`;

    try {
        window.open(mailto, '_blank', 'noopener');
        if (typeof showAlert === 'function') {
            showAlert('Votre demande est prête dans votre application e-mail. Aucune commande ni aucun paiement n’a été enregistré sur le site.', 'success');
        }
        closeBuyModal();
    } catch (error) {
        document.getElementById('deliveryLocationStatus').textContent = 'Impossible d’ouvrir votre application e-mail. Réessayez ou contactez-nous directement.';
    }
}

async function initGalleryMediaPage() {
    const galleryGrid = document.querySelector('[data-gallery-items]');
    if (!galleryGrid) return;

    const page = document.body.dataset.galleryPage || 'all';
    const status = document.querySelector('[data-gallery-status]');
    const adminPanel = document.getElementById('galleryAdminPanel');
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    let isAdmin = false;

    if (token) {
        try {
            const response = await fetch(`${API_URL}/admin/gallery/session`, {
                headers: authHeaders()
            });
            isAdmin = response.ok;
            if (!response.ok && response.status === 401) {
                sessionStorage.removeItem(AUTH_TOKEN_KEY);
            }
        } catch (error) {
            console.error('Impossible de vérifier les droits de gestion de la galerie:', error);
        }
    }

    if (adminPanel && isAdmin) adminPanel.hidden = false;

    const params = new URLSearchParams();
    if (page === 'photo' || page === 'video') params.set('type', page);
    if (page === 'match' || page === 'training') params.set('category', page);
    const query = params.toString();

    const renderMedia = (media) => {
        galleryGrid.replaceChildren();
        media.forEach((item) => {
            galleryGrid.appendChild(createGalleryMediaCard(item, isAdmin));
        });
        if (status) {
            status.textContent = media.length
                ? ''
                : 'Aucun média publié dans cette catégorie pour le moment.';
            status.hidden = media.length > 0;
        }
    };

    try {
        const response = await fetch(`${API_URL}/gallery/media${query ? `?${query}` : ''}`);
        if (!response.ok) throw new Error('Le serveur n’a pas pu charger les médias.');
        renderMedia(await response.json());
    } catch (error) {
        if (status) {
            status.textContent = 'Les médias publiés ne sont pas disponibles pour le moment.';
            status.hidden = false;
        }
        console.error('Échec du chargement des médias de la galerie:', error);
    }

    const uploadForm = document.getElementById('galleryUploadForm');
    if (uploadForm && isAdmin) {
        uploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = uploadForm.querySelector('[type="submit"]');
            const formStatus = document.getElementById('galleryUploadStatus');
            submitButton.disabled = true;
            formStatus.textContent = 'Publication en cours…';

            try {
                const response = await fetch(`${API_URL}/admin/gallery/media`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: new FormData(uploadForm)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Impossible de publier les médias.');

                uploadForm.reset();
                formStatus.textContent = result.message;
                const refreshed = await fetch(`${API_URL}/gallery/media${query ? `?${query}` : ''}`);
                if (!refreshed.ok) throw new Error('Les médias ont été publiés, mais la galerie n’a pas pu être actualisée.');
                renderMedia(await refreshed.json());
            } catch (error) {
                formStatus.textContent = error.message;
                console.error('Échec de la publication des médias:', error);
            } finally {
                submitButton.disabled = false;
            }
        });
    }
}

function createGalleryMediaCard(media, isAdmin) {
    const assetUrl = new URL(media.url, API_URL).href;
    const categoryLabel = media.category === 'match' ? 'Match'
        : media.category === 'training' ? 'Entraînement' : 'Autre';
    const card = document.createElement(media.type === 'photo' ? 'div' : 'article');

    if (media.type === 'photo') {
        card.className = 'galerie-card';
        const imageFrame = document.createElement('div');
        imageFrame.className = 'galerie-img';
        const image = document.createElement('img');
        image.src = assetUrl;
        image.alt = media.title;
        image.loading = 'lazy';
        const overlay = document.createElement('div');
        overlay.className = 'galerie-overlay';
        const caption = document.createElement('p');
        caption.textContent = `${media.title} · ${categoryLabel}`;
        overlay.appendChild(caption);
        imageFrame.append(image, overlay);
        const details = document.createElement('div');
        details.className = 'gallery-photo-caption';
        const title = document.createElement('h4');
        title.textContent = media.title;
        const category = document.createElement('p');
        category.textContent = categoryLabel;
        details.append(title, category);
        card.append(imageFrame, details);
    } else {
        card.className = 'video-card gallery-uploaded-video';
        const video = document.createElement('video');
        video.src = assetUrl;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        video.setAttribute('aria-label', media.title);
        const info = document.createElement('div');
        info.className = 'video-info';
        const heading = document.createElement('h4');
        heading.textContent = media.title;
        const category = document.createElement('p');
        category.textContent = categoryLabel;
        info.append(heading, category);
        card.append(video, info);
    }

    if (isAdmin) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'gallery-delete-media';
        deleteButton.textContent = 'Supprimer';
        deleteButton.addEventListener('click', async () => {
            if (!window.confirm(`Supprimer « ${media.title} » de la galerie ?`)) return;
            deleteButton.disabled = true;
            try {
                const response = await fetch(`${API_URL}/admin/gallery/media/${media.id}`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Impossible de supprimer ce média.');
                card.remove();
            } catch (error) {
                deleteButton.disabled = false;
                window.alert(error.message);
                console.error('Échec de la suppression du média:', error);
            }
        });
        card.appendChild(deleteButton);
    }

    return card;
}

async function initLiveGalleryPage() {
    const liveContainer = document.getElementById('liveStreamContainer');
    if (!liveContainer) return;

    const liveStatus = document.getElementById('liveStreamStatus');
    const embedContainer = document.getElementById('liveEmbedContainer');
    const liveTitle = document.getElementById('liveStreamTitle');
    const liveIndicator = document.querySelector('[data-live-indicator]');
    const adminPanel = document.getElementById('liveAdminPanel');
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const stopButton = document.getElementById('stopLiveStream');
    let currentStream = null;

    const renderLiveStream = (stream) => {
        currentStream = stream;
        embedContainer.replaceChildren();
        embedContainer.hidden = !stream;
        liveStatus.hidden = Boolean(stream);
        liveTitle.textContent = stream ? stream.title : 'Aucun direct en cours';
        if (liveIndicator) liveIndicator.hidden = !stream;
        if (stopButton) stopButton.hidden = !stream;
        if (!stream) return;

        const iframe = document.createElement('iframe');
        iframe.src = stream.embed_url;
        iframe.title = stream.title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        embedContainer.appendChild(iframe);

        const badge = document.createElement('span');
        badge.className = 'live-stream-badge';
        badge.textContent = 'EN DIRECT';
        liveTitle.appendChild(badge);
    };

    const loadStream = async () => {
        const response = await fetch(`${API_URL}/gallery/live`);
        if (!response.ok) throw new Error('Impossible de charger le direct.');
        renderLiveStream(await response.json());
    };

    try {
        await loadStream();
    } catch (error) {
        liveStatus.textContent = 'Le statut du direct est indisponible pour le moment.';
        console.error('Échec du chargement du direct:', error);
    }

    if (token) {
        try {
            const response = await fetch(`${API_URL}/admin/gallery/session`, {
                headers: authHeaders()
            });
            if (response.ok && adminPanel) adminPanel.hidden = false;
            if (!response.ok && response.status === 401) sessionStorage.removeItem(AUTH_TOKEN_KEY);
        } catch (error) {
            console.error('Impossible de vérifier les droits du direct:', error);
        }
    }

    const liveForm = document.getElementById('liveStreamForm');
    if (liveForm) {
        liveForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submitButton = liveForm.querySelector('[type="submit"]');
            const formStatus = document.getElementById('liveAdminStatus');
            submitButton.disabled = true;
            formStatus.textContent = 'Activation du direct…';

            try {
                const response = await fetch(`${API_URL}/admin/gallery/live`, {
                    method: 'PUT',
                    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: document.getElementById('liveTitleInput').value.trim(),
                        url: document.getElementById('liveUrlInput').value.trim()
                    })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Impossible d’activer le direct.');
                formStatus.textContent = result.message;
                await loadStream();
            } catch (error) {
                formStatus.textContent = error.message;
                console.error('Échec de l’activation du direct:', error);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    if (stopButton) {
        stopButton.addEventListener('click', async () => {
            if (!currentStream || !window.confirm('Arrêter la diffusion affichée sur le site ?')) return;
            stopButton.disabled = true;
            const formStatus = document.getElementById('liveAdminStatus');
            try {
                const response = await fetch(`${API_URL}/admin/gallery/live`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Impossible d’arrêter le direct.');
                formStatus.textContent = result.message;
                await loadStream();
            } catch (error) {
                formStatus.textContent = error.message;
                console.error('Échec de l’arrêt du direct:', error);
            } finally {
                stopButton.disabled = false;
            }
        });
    }
}

// Initialisation de la recherche et du tri sur la Boutique
document.addEventListener('DOMContentLoaded', () => {
    initShopControls();
});

function initShopControls() {
    const searchInput = document.getElementById('shopSearchInput');
    const sortSelect = document.getElementById('shopSortSelect');
    const cards = Array.from(document.querySelectorAll('.product-card'));

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            cards.forEach(card => {
                const title = (card.querySelector('h4')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
                const brand = (card.querySelector('.brand-tag')?.textContent || '').toLowerCase();
                
                if (title.includes(query) || desc.includes(query) || brand.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const grid = document.getElementById('product-list');
            if (!grid) return;

            const visibleCards = Array.from(grid.querySelectorAll('.product-card'));
            visibleCards.sort((a, b) => {
                const priceA = parseFloat(a.querySelector('.product-price')?.textContent.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
                const priceB = parseFloat(b.querySelector('.product-price')?.textContent.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
                
                if (val === 'price-asc') return priceA - priceB;
                if (val === 'price-desc') return priceB - priceA;
                return 0; // default order
            });

            visibleCards.forEach(card => grid.appendChild(card));
        });
    }
}

function toggleWishlist(btn) {
    const icon = btn.querySelector('i');
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#ef4444';
        if (typeof showAlert === 'function') showAlert('❤️ Article ajouté à vos favoris !', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '#64748b';
        if (typeof showAlert === 'function') showAlert('Article retiré de vos favoris', 'info');
    }
}


// ===== CARROUSEL D'ACTUALITÉS - ROTATION AUTOMATIQUE (10 secondes) =====

(function() {
    'use strict';

    const SLIDE_DURATION = 10000; // 10 secondes par actualité
    const PROGRESS_INTERVAL = 50; // Mise à jour de la barre de progression toutes les 50ms

    const track = document.getElementById('newsCarouselTrack');
    if (!track) return; // Ne pas exécuter si on n'est pas sur la page d'accueil

    const slides = track.querySelectorAll('.news-carousel-slide');
    const dots = document.querySelectorAll('.news-dot');
    const prevBtn = document.getElementById('newsPrevBtn');
    const nextBtn = document.getElementById('newsNextBtn');
    const progressFill = document.getElementById('newsProgressFill');

    if (slides.length === 0) return;

    let currentIndex = 0;
    let autoPlayTimer = null;
    let progressTimer = null;
    let progressValue = 0;
    let isPaused = false;

    // Fonction pour aller à un slide spécifique
    function goToSlide(index) {
        // Normaliser l'index (boucle)
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        // Retirer la classe active de tous les slides et dots
        slides.forEach(function(slide) {
            slide.classList.remove('active');
        });
        dots.forEach(function(dot) {
            dot.classList.remove('active');
        });

        // Activer le nouveau slide et dot
        slides[index].classList.add('active');
        if (dots[index]) {
            dots[index].classList.add('active');
        }

        currentIndex = index;

        // Réinitialiser la barre de progression
        resetProgress();
    }

    // Fonction pour aller au slide suivant
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    // Fonction pour aller au slide précédent
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Gestion de la barre de progression
    function startProgress() {
        progressValue = 0;
        if (progressFill) progressFill.style.width = '0%';

        progressTimer = setInterval(function() {
            if (isPaused) return;
            
            progressValue += (PROGRESS_INTERVAL / SLIDE_DURATION) * 100;
            
            if (progressFill) {
                progressFill.style.width = Math.min(progressValue, 100) + '%';
            }

            if (progressValue >= 100) {
                clearInterval(progressTimer);
            }
        }, PROGRESS_INTERVAL);
    }

    function resetProgress() {
        clearInterval(progressTimer);
        progressValue = 0;
        if (progressFill) progressFill.style.width = '0%';
        startProgress();
    }

    // Démarrer la rotation automatique
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(function() {
            if (!isPaused) {
                nextSlide();
            }
        }, SLIDE_DURATION);
        startProgress();
    }

    // Arrêter la rotation automatique
    function stopAutoPlay() {
        clearInterval(autoPlayTimer);
        clearInterval(progressTimer);
        autoPlayTimer = null;
        progressTimer = null;
    }

    // Événements des boutons prev/next
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            // Redémarrer le timer après interaction manuelle
            startAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            // Redémarrer le timer après interaction manuelle
            startAutoPlay();
        });
    }

    // Événements des dots
    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'));
            goToSlide(index);
            // Redémarrer le timer après interaction manuelle
            startAutoPlay();
        });
    });

    // Pause au survol du carrousel
    var carouselWrapper = document.querySelector('.news-carousel-wrapper');
    if (carouselWrapper) {
        carouselWrapper.addEventListener('mouseenter', function() {
            isPaused = true;
        });

        carouselWrapper.addEventListener('mouseleave', function() {
            isPaused = false;
        });
    }

    // Support swipe tactile (mobile)
    var touchStartX = 0;
    var touchEndX = 0;

    if (track) {
        track.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        track.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            var diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide(); // Swipe gauche → suivant
                } else {
                    prevSlide(); // Swipe droit → précédent
                }
                startAutoPlay();
            }
        }, { passive: true });
    }

    // Navigation clavier quand le carrousel est visible
    document.addEventListener('keydown', function(e) {
        var carouselSection = document.getElementById('actualites-accueil');
        if (!carouselSection) return;
        
        var rect = carouselSection.getBoundingClientRect();
        var isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                startAutoPlay();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                startAutoPlay();
            }
        }
    });

    // Démarrer le carrousel
    startAutoPlay();

})();
