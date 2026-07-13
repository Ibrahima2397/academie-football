// Menu hamburger
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Fermer le menu quand on clique sur un lien
const navLinks = navMenu.querySelectorAll('a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Gestion du formulaire de contact
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const nom = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const telephone = this.querySelector('input[type="tel"]').value;
        const categorie = this.querySelector('select').value;
        const message = this.querySelector('textarea').value;

        // Afficher un message de confirmation
        if (nom && email && telephone && categorie && message) {
            showAlert('Merci pour votre message! Nous vous recontacterons bientôt.', 'success');
            this.reset();
        } else {
            showAlert('Veuillez remplir tous les champs du formulaire.', 'error');
        }
    });
}

// Fonction pour afficher les alertes
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Ajouter les styles CSS pour l'alerte
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background-color: #10b981; color: white;' : 'background-color: #ef4444; color: white;'}
    `;
    
    document.body.appendChild(alertDiv);
    
    // Retirer l'alerte après 3 secondes
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
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Ajouter le style pour le lien actif
const activeStyle = document.createElement('style');
activeStyle.textContent = `
    .nav-menu a.active {
        color: #f59e0b;
        border-bottom: 2px solid #f59e0b;
        padding-bottom: 5px;
    }
`;
document.head.appendChild(activeStyle);

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

// Observer toutes les cartes
document.querySelectorAll('.programme-card, .equipe-card, .tarif-card, .schedule-item').forEach(element => {
    element.style.opacity = '0';
    observer.observe(element);
});

// Configuration de l'API
const API_URL = 'http://localhost:3000/api';

// Gestion du formulaire d'inscription
const signupForm = document.querySelector('.auth-page img[src*="logo.png"]')?.closest('.auth-container')?.querySelector('form.auth-form');
if (signupForm && window.location.pathname.includes('inscription.html')) {
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, password })
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
                    window.location.href = '../index.html';
                }, 1500);
            } else {
                showAlert(data.message || 'Identifiants invalides.', 'error');
            }
        } catch (error) {
            showAlert('Erreur de connexion au serveur. Vérifiez que le backend est démarré.', 'error');
        }
    });
}

// Ajouter des informations au console pour le débogage
console.log('Site Académie Elite Football - Chargé avec succès');
console.log('Backend API URL:', API_URL);
