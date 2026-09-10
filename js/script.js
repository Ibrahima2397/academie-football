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
        
        // Fermer le menu quand on clique sur un lien (sauf sur le parent dropdown)
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.parentElement.classList.contains('dropdown')) {
                    // Si c'est le lien principal d'un dropdown sur mobile
                    if (window.innerWidth <= 768) {
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
            if (window.innerWidth > 768) {
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

// Fonction globale d'ouverture du modal d'achat avec paiement Mobile Money (Orange Money, MTN MoMo, Wave, CB)
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
                            <span style="color: #0f172a; font-weight: 700; display: block;">Total à régler:</span>
                            <span id="modalProdGnf" style="color: #64748b; font-size: 0.8rem; font-weight: 600;">(~ 0 GNF)</span>
                        </div>
                        <strong id="modalProdTotal" style="color: #16a34a; font-size: 1.35rem; font-weight: 800;"></strong>
                    </div>
                </div>

                <!-- Mode de paiement -->
                <div style="margin-bottom: 1.25rem;">
                    <label style="display: block; font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 0.6rem;">
                        <i class="fas fa-wallet" style="color: #f59e0b; margin-right: 0.4rem;"></i> Choisir le moyen de paiement:
                    </label>
                    <div class="payment-methods-grid" id="paymentMethodsGrid">
                        <div class="payment-method-card selected" onclick="selectPaymentMethod('orange')" data-method="orange">
                            <div class="payment-icon orange"><i class="fas fa-mobile-alt"></i></div>
                            <span class="payment-name">Orange Money</span>
                            <span class="payment-subtitle">*144# (Guinée)</span>
                        </div>
                        <div class="payment-method-card mtn" onclick="selectPaymentMethod('mtn')" data-method="mtn">
                            <div class="payment-icon mtn"><i class="fas fa-phone-alt"></i></div>
                            <span class="payment-name">MTN MoMo</span>
                            <span class="payment-subtitle">*145# (Guinée)</span>
                        </div>
                        <div class="payment-method-card wave" onclick="selectPaymentMethod('wave')" data-method="wave">
                            <div class="payment-icon wave"><i class="fas fa-water"></i></div>
                            <span class="payment-name">Wave</span>
                            <span class="payment-subtitle">Mobile App</span>
                        </div>
                        <div class="payment-method-card card" onclick="selectPaymentMethod('card')" data-method="card">
                            <div class="payment-icon card"><i class="fas fa-credit-card"></i></div>
                            <span class="payment-name">Carte Visa/MC</span>
                            <span class="payment-subtitle">En ligne</span>
                        </div>
                    </div>
                </div>

                <!-- Champ Numéro Mobile / Compte -->
                <div id="paymentPhoneContainer" style="margin-bottom: 1.25rem;">
                    <label for="payPhoneNumber" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 0.4rem;">
                        <i class="fas fa-phone" style="color: #ff6600;" id="phoneLabelIcon"></i> <span id="phoneLabelText">Numéro Orange Money:</span>
                    </label>
                    <div class="phone-input-group">
                        <div class="phone-prefix">
                            <span>🇬🇳</span> +224
                        </div>
                        <input type="tel" id="payPhoneNumber" class="phone-field" placeholder="62X XX XX XX" maxlength="12">
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                    <button onclick="closeBuyModal()" style="flex: 1; padding: 0.85rem; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; border-radius: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s;">Annuler</button>
                    <button id="submitPayBtn" onclick="confirmOrder()" style="flex: 2; padding: 0.85rem; border: none; background: linear-gradient(135deg, #ff6600 0%, #d95300 100%); color: white; border-radius: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(255,102,0,0.35); font-size: 0.95rem;">
                        <i class="fas fa-paper-plane" style="margin-right: 0.4rem;"></i> Payer avec Orange Money
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
    window.selectedPayMethod = 'orange';

    updateModalTotals(1);

    modal.classList.add('active');
}

function updateModalTotals(qty) {
    const numPrice = window.currentUnitNumPrice || 35.00;
    const totalEur = (numPrice * qty).toFixed(2);
    const totalGnf = Math.round(numPrice * qty * 9500).toLocaleString('fr-FR');

    const totalElem = document.getElementById('modalProdTotal');
    const gnfElem = document.getElementById('modalProdGnf');
    
    if (totalElem) totalElem.textContent = totalEur + ' €';
    if (gnfElem) gnfElem.textContent = `(~ ${totalGnf} GNF)`;
}

function changeModalQty(delta) {
    const qtyInput = document.getElementById('buyQty');
    if (!qtyInput) return;
    let qty = parseInt(qtyInput.value) || 1;
    qty = Math.max(1, Math.min(99, qty + delta));
    qtyInput.value = qty;
    updateModalTotals(qty);
}

function selectPaymentMethod(method) {
    window.selectedPayMethod = method;
    const cards = document.querySelectorAll('.payment-method-card');
    cards.forEach(c => c.classList.remove('selected'));

    const activeCard = document.querySelector(`.payment-method-card[data-method="${method}"]`);
    if (activeCard) activeCard.classList.add('selected');

    const phoneContainer = document.getElementById('paymentPhoneContainer');
    const phoneInput = document.getElementById('payPhoneNumber');
    const phoneLabelText = document.getElementById('phoneLabelText');
    const phoneLabelIcon = document.getElementById('phoneLabelIcon');
    const submitBtn = document.getElementById('submitPayBtn');

    if (method === 'orange') {
        phoneContainer.style.display = 'block';
        phoneLabelText.textContent = 'Numéro Orange Money:';
        phoneLabelIcon.style.color = '#ff6600';
        if (phoneInput) phoneInput.placeholder = '62X XX XX XX';
        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #ff6600 0%, #d95300 100%)';
            submitBtn.style.boxShadow = '0 4px 14px rgba(255,102,0,0.35)';
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 0.4rem;"></i> Payer avec Orange Money';
        }
    } else if (method === 'mtn') {
        phoneContainer.style.display = 'block';
        phoneLabelText.textContent = 'Numéro MTN Mobile Money:';
        phoneLabelIcon.style.color = '#e6b800';
        if (phoneInput) phoneInput.placeholder = '66X XX XX XX';
        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #e6b800 0%, #b38f00 100%)';
            submitBtn.style.boxShadow = '0 4px 14px rgba(230,184,0,0.35)';
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 0.4rem;"></i> Payer avec MTN MoMo';
        }
    } else if (method === 'wave') {
        phoneContainer.style.display = 'block';
        phoneLabelText.textContent = 'Numéro Wave Mobile:';
        phoneLabelIcon.style.color = '#00aaff';
        if (phoneInput) phoneInput.placeholder = '62X / 66X XX XX XX';
        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #00aaff 0%, #0088cc 100%)';
            submitBtn.style.boxShadow = '0 4px 14px rgba(0,170,255,0.35)';
            submitBtn.innerHTML = '<i class="fas fa-paper-plane" style="margin-right: 0.4rem;"></i> Payer avec Wave';
        }
    } else if (method === 'card') {
        phoneContainer.style.display = 'block';
        phoneLabelText.textContent = 'Numéro de Téléphone (Contact):';
        phoneLabelIcon.style.color = '#1e3a8a';
        if (phoneInput) phoneInput.placeholder = '6XX XX XX XX';
        if (submitBtn) {
            submitBtn.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)';
            submitBtn.style.boxShadow = '0 4px 14px rgba(30,58,138,0.35)';
            submitBtn.innerHTML = '<i class="fas fa-credit-card" style="margin-right: 0.4rem;"></i> Payer par Carte Bancaire';
        }
    }
}

function closeBuyModal() {
    const modal = document.getElementById('shopBuyModal');
    if (modal) modal.classList.remove('active');
}

function confirmOrder() {
    const name = document.getElementById('modalProdTitle').textContent;
    const totalEur = document.getElementById('modalProdTotal').textContent;
    const totalGnf = document.getElementById('modalProdGnf').textContent;
    const method = window.selectedPayMethod || 'orange';
    const phoneInput = document.getElementById('payPhoneNumber');
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if ((method === 'orange' || method === 'mtn' || method === 'wave') && (!phone || phone.length < 8)) {
        if (typeof showAlert === 'function') {
            showAlert('⚠️ Veuillez saisir un numéro de téléphone valide à 9 chiffres (+224).', 'danger');
        } else {
            alert('Veuillez saisir un numéro de téléphone valide (+224).');
        }
        return;
    }

    closeBuyModal();

    let methodTitle = 'Orange Money (*144#)';
    if (method === 'mtn') methodTitle = 'MTN Mobile Money (*145#)';
    if (method === 'wave') methodTitle = 'Wave Mobile';
    if (method === 'card') methodTitle = 'Carte Bancaire';

    const msg = `📲 Demande de paiement ${methodTitle} transmise ! Montant: ${totalEur} ${totalGnf}. ${phone ? 'Numéro: +224 ' + phone + '. Veuillez composer le code de validation sur votre téléphone.' : ''}`;

    if (typeof showAlert === 'function') {
        showAlert(`🎉 Commande enregistrée pour "${name}" ! ${msg}`, 'success');
    } else {
        alert(`Commande enregistrée pour "${name}" ! ${msg}`);
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


