const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Connexion à la base de données SQLite
const db = new sqlite3.Database('./academie.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite (academie.db)');
        
        // Initialisation du schéma robuste
        db.serialize(() => {
            // Table des utilisateurs (avec rôles)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullname TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'player', -- admin, coach, player, parent
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Table des catégories (U10, U14, etc.)
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price_per_month REAL
            )`, () => {
                // Insertion des catégories par défaut
                const stmt = db.prepare("INSERT OR IGNORE INTO categories (id, name, description, price_per_month) VALUES (?, ?, ?, ?)");
                stmt.run(1, 'Enfants (U8-U12)', 'Initiation et fondamentaux', 50);
                stmt.run(2, 'Jeunes (U13-U17)', 'Technique et tactique avancée', 75);
                stmt.run(3, 'Élite (U18+)', 'Préparation professionnelle', 120);
                stmt.finalize();
            });

            // Table des entraîneurs
            db.run(`CREATE TABLE IF NOT EXISTS coaches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                bio TEXT,
                specialty TEXT,
                experience_years INTEGER,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Table des équipes
            db.run(`CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id INTEGER,
                coach_id INTEGER,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (coach_id) REFERENCES coaches (id)
            )`);

            // Table des joueurs
            db.run(`CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                firstname TEXT NOT NULL,
                lastname TEXT NOT NULL,
                birth_date DATE,
                position TEXT,
                category_id INTEGER,
                team_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (team_id) REFERENCES teams (id)
            )`, () => {
                // Migration : ajouter team_id si la table existait déjà sans cette colonne
                db.run(`ALTER TABLE players ADD COLUMN team_id INTEGER`, (err) => {
                    // Ignore error if column already exists
                });
            });

            // Table des entraînements
            db.run(`CREATE TABLE IF NOT EXISTS trainings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_id INTEGER,
                day_of_week TEXT,
                start_time TEXT,
                end_time TEXT,
                location TEXT,
                FOREIGN KEY (team_id) REFERENCES teams (id)
            )`);

            // Table des inscriptions
            db.run(`CREATE TABLE IF NOT EXISTS inscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER,
                category_id INTEGER,
                status TEXT DEFAULT 'en_attente', -- en_attente, approuvé, payé, annulé
                registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES players (id),
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )`);

            // Table des messages de contact
            db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                category TEXT,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'nouveau', -- nouveau, lu, répondu
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Seeding - Données de démonstration et d'initialisation
            const salt = bcrypt.genSaltSync(10);
            const hashedAdminPassword = bcrypt.hashSync('admin', salt);
            const hashedCoachPassword = bcrypt.hashSync('coach', salt);

            // 1. Admin
            db.run(`INSERT OR IGNORE INTO users (id, fullname, email, password, role) 
                    VALUES (1, 'Administrateur FADY', 'admin@academiefady.com', ?, 'admin')`, 
                    [hashedAdminPassword]);

            // 2. Coachs (users)
            db.run(`INSERT OR IGNORE INTO users (id, fullname, email, password, role) 
                    VALUES (2, 'Coach Jean Dupont', 'jean.dupont@academiefady.com', ?, 'coach')`, 
                    [hashedCoachPassword]);
            db.run(`INSERT OR IGNORE INTO users (id, fullname, email, password, role) 
                    VALUES (3, 'Coach Baldé Ibrahima Sory', 'balde.ibrahima@academiefady.com', ?, 'coach')`, 
                    [hashedCoachPassword]);
            db.run(`INSERT OR IGNORE INTO users (id, fullname, email, password, role) 
                    VALUES (4, 'Coach Camara', 'coach.camara@academiefady.com', ?, 'coach')`, 
                    [hashedCoachPassword]);

            // 3. Coachs (profils)
            db.run(`INSERT OR IGNORE INTO coaches (id, user_id, bio, specialty, experience_years) 
                    VALUES (1, 2, 'Ancien joueur professionnel, spécialiste de la formation de base.', 'U10 / Initiation', 10)`);
            db.run(`INSERT OR IGNORE INTO coaches (id, user_id, bio, specialty, experience_years) 
                    VALUES (2, 3, 'Expert en tactique et technique individuelle pour les jeunes compétiteurs.', 'U14 / Technique', 8)`);
            db.run(`INSERT OR IGNORE INTO coaches (id, user_id, bio, specialty, experience_years) 
                    VALUES (3, 4, 'Préparateur physique agréé, focalisé sur la transition vers le niveau pro.', 'U18 / Élite', 12)`);

            // 4. Équipes
            db.run(`INSERT OR IGNORE INTO teams (id, name, category_id, coach_id) VALUES (1, 'U10 Elite', 1, 1)`);
            db.run(`INSERT OR IGNORE INTO teams (id, name, category_id, coach_id) VALUES (2, 'U14 Élite', 2, 2)`);
            db.run(`INSERT OR IGNORE INTO teams (id, name, category_id, coach_id) VALUES (3, 'U18 Elite', 3, 3)`);

            // 5. Entraînements (lundi, mercredi, vendredi, samedi)
            // Lundi
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (1, 1, 'Lundi', '17h00', '18h00', 'Terrain Sud')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (2, 2, 'Lundi', '18h30', '19h30', 'Terrain Nord')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (3, 3, 'Lundi', '20h00', '21h30', 'Terrain Principal')`);
            // Mercredi
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (4, 1, 'Mercredi', '15h00', '16h00', 'Terrain Sud')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (5, 2, 'Mercredi', '16h30', '17h30', 'Terrain Nord')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (6, 3, 'Mercredi', '18h00', '19h30', 'Terrain Principal')`);
            // Vendredi
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (7, 1, 'Vendredi', '17h00', '18h00', 'Terrain Sud')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (8, 2, 'Vendredi', '18h30', '19h30', 'Terrain Nord')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (9, 3, 'Vendredi', '20h00', '21h30', 'Terrain Principal')`);
            // Samedi
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (10, 3, 'Samedi', '09h00', '11h00', 'Terrain Principal')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (11, 2, 'Samedi', '14h00', '16h00', 'Terrain Principal')`);
        });
    }
});

// Middleware d'authentification Admin
function isAdmin(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'Non autorisé. Identifiant manquant.' });
    }
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès interdit. Rôle administrateur requis.' });
        }
        next();
    });
}

// Route d'inscription utilisateur
app.post('/api/register', async (req, res) => {
    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)`;
        db.run(query, [fullname, email, hashedPassword, role || 'player'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
                }
                return res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
            }
            res.status(201).json({ message: 'Inscription réussie !', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Route de connexion
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la connexion.' });
        }
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        res.json({ 
            message: 'Connexion réussie !', 
            user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role } 
        });
    });
});

// Route pour le formulaire de contact
app.post('/api/contact', (req, res) => {
    const { name, email, phone, category, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Veuillez remplir les champs obligatoires (nom, email, message).' });
    }

    const query = `INSERT INTO contact_messages (name, email, phone, category, message) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name, email, phone, category, message], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de l\'envoi du message.' });
        }
        res.status(201).json({ message: 'Message envoyé avec succès !', contactId: this.lastID });
    });
});

// --- ROUTES DYNAMIQUES ET DE PROFIL ---

// 1. Obtenir les catégories
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// 2. Obtenir les équipes (avec détails)
app.get('/api/teams', (req, res) => {
    const query = `
        SELECT t.id, t.name, c.name AS category_name, u.fullname AS coach_name,
               (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) AS player_count
        FROM teams t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN coaches co ON t.coach_id = co.id
        LEFT JOIN users u ON co.user_id = u.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// 3. Obtenir les entraînements (avec équipe)
app.get('/api/trainings', (req, res) => {
    const query = `
        SELECT tr.id, tr.day_of_week, tr.start_time, tr.end_time, tr.location, t.name AS team_name
        FROM trainings tr
        LEFT JOIN teams t ON tr.team_id = t.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// 4. Obtenir le profil de l'utilisateur connecté (Joueur ou Coach)
app.get('/api/profile', (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'Non autorisé. Identifiant manquant.' });
    }

    db.get('SELECT id, fullname, email, role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        if (user.role === 'coach') {
            db.get('SELECT * FROM coaches WHERE user_id = ?', [userId], (err, coach) => {
                if (err) return res.status(500).json({ message: 'Erreur serveur.' });
                res.json({ user, coach: coach || null });
            });
        } else {
            db.get(`
                SELECT p.*, i.status AS inscription_status, i.id AS inscription_id, c.name AS category_name, t.name AS team_name
                FROM players p
                LEFT JOIN inscriptions i ON p.id = i.player_id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN teams t ON p.team_id = t.id
                WHERE p.user_id = ?
            `, [userId], (err, player) => {
                if (err) return res.status(500).json({ message: 'Erreur serveur.' });
                res.json({ user, player: player || null });
            });
        }
    });
});

// 5. Enregistrer ou mettre à jour le profil (Joueur ou Coach)
app.post('/api/profile', (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'Non autorisé.' });
    }

    db.get('SELECT id, role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        if (user.role === 'coach') {
            const { bio, specialty, experience_years } = req.body;
            db.get('SELECT id FROM coaches WHERE user_id = ?', [userId], (err, coachRow) => {
                if (err) return res.status(500).json({ message: 'Erreur de recherche.' });
                if (coachRow) {
                    db.run('UPDATE coaches SET bio = ?, specialty = ?, experience_years = ? WHERE user_id = ?',
                        [bio, specialty, experience_years, userId], (err) => {
                            if (err) return res.status(500).json({ message: 'Erreur de mise à jour.' });
                            res.json({ message: 'Profil entraîneur mis à jour !' });
                        });
                } else {
                    db.run('INSERT INTO coaches (user_id, bio, specialty, experience_years) VALUES (?, ?, ?, ?)',
                        [userId, bio, specialty, experience_years], (err) => {
                            if (err) return res.status(500).json({ message: 'Erreur de création.' });
                            res.status(201).json({ message: 'Profil entraîneur créé !' });
                        });
                }
            });
        } else {
            const { firstname, lastname, birth_date, position, category_id } = req.body;
            db.get('SELECT id FROM players WHERE user_id = ?', [userId], (err, playerRow) => {
                if (err) return res.status(500).json({ message: 'Erreur de recherche.' });
                if (playerRow) {
                    const playerId = playerRow.id;
                    db.run('UPDATE players SET firstname = ?, lastname = ?, birth_date = ?, position = ?, category_id = ? WHERE user_id = ?',
                        [firstname, lastname, birth_date, position, category_id, userId], (err) => {
                            if (err) return res.status(500).json({ message: 'Erreur de mise à jour.' });
                            db.run('UPDATE inscriptions SET category_id = ? WHERE player_id = ?', [category_id, playerId], (err) => {
                                res.json({ message: 'Profil joueur mis à jour !', playerId });
                            });
                        });
                } else {
                    db.run('INSERT INTO players (user_id, firstname, lastname, birth_date, position, category_id) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, firstname, lastname, birth_date, position, category_id], function(err) {
                            if (err) return res.status(500).json({ message: 'Erreur de création.' });
                            const newPlayerId = this.lastID;
                            db.run('INSERT INTO inscriptions (player_id, category_id, status) VALUES (?, ?, ?)',
                                [newPlayerId, category_id, 'en_attente'], (err) => {
                                    if (err) return res.status(500).json({ message: 'Erreur d\'inscription.' });
                                    res.status(201).json({ message: 'Profil joueur et inscription créés !', playerId: newPlayerId });
                                });
                        });
                }
            });
        }
    });
});

// 6. Obtenir le roster de l'entraîneur connecté
app.get('/api/coach/roster', (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ message: 'Non autorisé.' });

    db.get('SELECT id FROM coaches WHERE user_id = ?', [userId], (err, coach) => {
        if (err || !coach) return res.status(404).json({ message: 'Entraîneur non trouvé.' });

        db.all(`
            SELECT p.firstname, p.lastname, p.birth_date, p.position, t.name AS team_name, u.email
            FROM players p
            JOIN teams t ON p.team_id = t.id
            JOIN users u ON p.user_id = u.id
            WHERE t.coach_id = ?
        `, [coach.id], (err, players) => {
            if (err) return res.status(500).json({ message: 'Erreur serveur.' });
            res.json(players);
        });
    });
});

// --- API D'ADMINISTRATION (PROTÉGÉES PAR MIDDLEWARE isAdmin) ---

// 1. Obtenir tous les joueurs et inscriptions
app.get('/api/admin/players', isAdmin, (req, res) => {
    const query = `
        SELECT p.id AS player_id, p.firstname, p.lastname, p.birth_date, p.position,
               u.email, u.fullname,
               i.id AS inscription_id, i.status AS inscription_status, i.registration_date,
               c.name AS category_name, c.id AS category_id,
               t.name AS team_name, t.id AS team_id
        FROM players p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN inscriptions i ON p.id = i.player_id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN teams t ON p.team_id = t.id
        ORDER BY i.registration_date DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// 2. Mettre à jour le statut d'une inscription
app.put('/api/admin/inscriptions/:id', isAdmin, (req, res) => {
    const inscriptionId = req.params.id;
    const { status } = req.body;

    db.run('UPDATE inscriptions SET status = ? WHERE id = ?', [status, inscriptionId], (err) => {
        if (err) return res.status(500).json({ message: 'Erreur lors de la modification.' });
        res.json({ message: 'Statut de l\'inscription mis à jour !' });
    });
});

// 3. Assigner un joueur à une équipe
app.put('/api/admin/players/:id/team', isAdmin, (req, res) => {
    const playerId = req.params.id;
    const { team_id } = req.body;

    db.run('UPDATE players SET team_id = ? WHERE id = ?', [team_id === 'none' ? null : team_id, playerId], (err) => {
        if (err) return res.status(500).json({ message: 'Erreur d\'affectation.' });
        res.json({ message: 'Joueur affecté à l\'équipe avec succès !' });
    });
});

// 4. Obtenir les messages de contact
app.get('/api/admin/contacts', isAdmin, (req, res) => {
    db.all('SELECT * FROM contact_messages ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// 5. Mettre à jour le statut d'un message
app.put('/api/admin/contacts/:id', isAdmin, (req, res) => {
    const contactId = req.params.id;
    const { status } = req.body;

    db.run('UPDATE contact_messages SET status = ? WHERE id = ?', [status, contactId], (err) => {
        if (err) return res.status(500).json({ message: 'Erreur.' });
        res.json({ message: 'Message marqué comme traité.' });
    });
});

// 6. Obtenir tous les entraîneurs (pour formulaires)
app.get('/api/admin/coaches', isAdmin, (req, res) => {
    const query = `
        SELECT c.id AS coach_id, u.fullname, u.email, c.specialty, c.experience_years
        FROM coaches c
        JOIN users u ON c.user_id = u.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// 7. Ajouter une équipe
app.post('/api/admin/teams', isAdmin, (req, res) => {
    const { name, category_id, coach_id } = req.body;
    db.run('INSERT INTO teams (name, category_id, coach_id) VALUES (?, ?, ?)',
        [name, category_id || null, coach_id || null], function(err) {
            if (err) return res.status(500).json({ message: 'Erreur lors de la création.' });
            res.status(201).json({ message: 'Équipe créée avec succès !', teamId: this.lastID });
        });
});

// 8. Ajouter un entraînement
app.post('/api/admin/trainings', isAdmin, (req, res) => {
    const { team_id, day_of_week, start_time, end_time, location } = req.body;
    db.run('INSERT INTO trainings (team_id, day_of_week, start_time, end_time, location) VALUES (?, ?, ?, ?, ?)',
        [team_id, day_of_week, start_time, end_time, location], function(err) {
            if (err) return res.status(500).json({ message: 'Erreur lors de l\'ajout du créneau.' });
            res.status(201).json({ message: 'Créneau d\'entraînement ajouté !', trainingId: this.lastID });
        });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
