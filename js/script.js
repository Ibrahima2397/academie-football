// Configuration de l'API
const API_URL = 'http://localhost:3000/api';

// Menu hamburger et navigation responsive
document.addEventListener('DOMContentLoaded', () => {
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
        
        // Fermer le menu quand on clique sur un lien
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                // Ne pas fermer si c'est un dropdown
                if (!link.closest('.dropdown')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });
        
        // Gestion des dropdowns sur mobile
        dropdowns?.forEach(dropdown => {
            const dropdownLink = dropdown.querySelector('a:first-child');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            
            if (dropdownLink && dropdownMenu) {
                dropdownLink.addEventListener('click', (e) => {
                    // Sur mobile (écran < 768px)
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        dropdown.classList.toggle('active');
                    }
                });
            }
        });
        
        // Fermer le menu quand on clique en dehors
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
        
        // Ajuster la navigation au redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                dropdowns?.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }
});

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
    const scheduleDiv = document.querySelector('.schedule');
    if (!scheduleDiv) return;

    try {
        const res = await fetch(`${API_URL}/trainings`);
        if (!res.ok) throw new Error();
        const trainings = await res.json();

        if (trainings.length > 0) {
            const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            const grouped = {};
            days.forEach(d => grouped[d] = []);

            trainings.forEach(tr => {
                if (grouped[tr.day_of_week]) {
                    grouped[tr.day_of_week].push(tr);
                }
            });

            scheduleDiv.innerHTML = '';
            days.forEach(day => {
                const items = grouped[day];
                if (items.length > 0) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'schedule-item';
                    
                    let detailsHtml = '';
                    items.forEach(tr => {
                        const terrainLetter = tr.location.includes('Sud') ? 'S' : (tr.location.includes('Nord') ? 'N' : 'P');
                        detailsHtml += `
                            <p><strong>${tr.start_time} - ${tr.end_time}:</strong> ${tr.team_name} 
                            <a href="https://maps.google.com/?q=${encodeURIComponent(tr.location)}+Labe+Guinee" target="_blank" class="terrain-link" title="${tr.location}"><i class="fas fa-map-marker-alt"></i> ${terrainLetter}</a></p>
                        `;
                    });

                    itemDiv.innerHTML = `
                        <div class="jour">${day}</div>
                        <div class="details">${detailsHtml}</div>
                    `;
                    scheduleDiv.appendChild(itemDiv);
                }
            });
        }
    } catch (err) {
        console.log('Utilisation des données statiques pour les entraînements (serveur hors ligne).');
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
                
                const avatarName = cat.id === 1 ? 'U12' : (cat.id === 2 ? 'U17' : 'ELITE');
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
                    <div class="programme-price" style="margin-top: 1rem; font-weight: bold; color: var(--primary-color);">
                        Tarif : ${cat.price_per_month} € / mois
                    </div>
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
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
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

document.querySelectorAll('.programme-card, .equipe-card, .tarif-card, .schedule-item').forEach(element => {
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
    const cards = Array.from(document.querySelectorAll('.player-card'));

    function showCategory(cat) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.category === cat));

        // animation simple: fade out current, then show matching
        cards.forEach(card => {
            if (card.dataset.category === cat) {
                card.style.display = '';
                card.style.opacity = '0';
                requestAnimationFrame(() => {
                    card.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            } else {
                card.style.transition = 'opacity 200ms ease-in, transform 200ms ease-in';
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => { card.style.display = 'none'; }, 220);
            }
        });
    }

    // Attacher les handlers
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const cat = tab.dataset.category;
            showCategory(cat);
        });
    });

    // Afficher la catégorie active initiale
    const active = tabs.find(t => t.classList.contains('active')) || tabs[0];
    if (active) showCategory(active.dataset.category);
}
