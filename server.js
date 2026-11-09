const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const databasePath = process.env.ACADEMIE_DB_PATH || path.join(__dirname, 'academie.db');
const galleryUploadDirectory = process.env.GALLERY_UPLOAD_DIR || path.join(__dirname, 'uploads', 'gallery');
const gallerySessions = new Map();
const gallerySessionLifetime = 12 * 60 * 60 * 1000;

if (process.env.ADMIN_BOOTSTRAP_PASSWORD && process.env.ADMIN_BOOTSTRAP_PASSWORD.length < 16) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD doit contenir au moins 16 caractères.');
}

fs.mkdirSync(galleryUploadDirectory, { recursive: true });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads/gallery', express.static(galleryUploadDirectory, {
    index: false,
    setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));
app.use(express.static(path.join(__dirname, '.')));

// Connexion à la base de données SQLite
const db = new sqlite3.Database(databasePath, (err) => {
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

            // Catégories des équipes de l'académie
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price_per_month REAL
            )`, () => {
                // Insertion des catégories par défaut
                const stmt = db.prepare("INSERT OR IGNORE INTO categories (id, name, description, price_per_month) VALUES (?, ?, ?, ?)");
                stmt.run(1, 'U17 Régional', 'Équipe U17 engagée au niveau régional', 50);
                stmt.run(2, 'Seniors D1', 'Équipe senior engagée en Division 1', 75);
                stmt.run(3, 'U15 Régional', 'Équipe U15 engagée au niveau régional', 120);
                stmt.finalize((finalizeError) => {
                    if (finalizeError) {
                        console.error('Erreur lors de l’initialisation des catégories:', finalizeError.message);
                        return;
                    }

                    db.run(`UPDATE categories
                            SET name = CASE id
                                    WHEN 1 THEN 'U17 Régional'
                                    WHEN 2 THEN 'Seniors D1'
                                    WHEN 3 THEN 'U15 Régional'
                                END,
                                description = CASE id
                                    WHEN 1 THEN 'Équipe U17 engagée au niveau régional'
                                    WHEN 2 THEN 'Équipe senior engagée en Division 1'
                                    WHEN 3 THEN 'Équipe U15 engagée au niveau régional'
                                END
                            WHERE name IN ('Enfants (U8-U12)', 'Jeunes (U13-U17)', 'Élite (U18+)')`,
                    (updateError) => {
                        if (updateError) {
                            console.error('Erreur lors de la mise à jour des catégories:', updateError.message);
                        }
                    });
                });
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

            db.run(`CREATE TABLE IF NOT EXISTS training_day_settings (
                day_of_week TEXT PRIMARY KEY,
                is_active INTEGER NOT NULL DEFAULT 0 CHECK(is_active IN (0, 1))
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

            db.run(`CREATE TABLE IF NOT EXISTS gallery_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('photo', 'video')),
                category TEXT NOT NULL CHECK(category IN ('match', 'training', 'other')),
                file_name TEXT NOT NULL UNIQUE,
                mime_type TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS academy_directors (
                id INTEGER PRIMARY KEY,
                role TEXT NOT NULL,
                fullname TEXT NOT NULL DEFAULT '',
                bio TEXT NOT NULL DEFAULT '',
                photo_url TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            const directorStatement = db.prepare(
                'INSERT OR IGNORE INTO academy_directors (id, role, photo_url) VALUES (?, ?, ?)'
            );
            [
                [1, 'Président', '/images/dirigeants/president.svg'],
                [2, 'Vice-président', '/images/dirigeants/vice-president.svg'],
                [3, 'Secrétaire général', '/images/dirigeants/secretaire-general.svg'],
                [4, 'Trésorier', '/images/dirigeants/tresorier.svg'],
                [5, 'Directeur des Affaires intérieures', '/images/dirigeants/affaires-interieures.svg']
            ].forEach((director) => directorStatement.run(director));
            directorStatement.finalize((error) => {
                if (error) console.error('Erreur lors de l’initialisation des dirigeants:', error.message);
            });

            db.run(`CREATE TABLE IF NOT EXISTS gallery_live_stream (
                id INTEGER PRIMARY KEY CHECK(id = 1),
                title TEXT NOT NULL,
                platform TEXT NOT NULL CHECK(platform IN ('youtube', 'facebook')),
                source_url TEXT NOT NULL,
                embed_url TEXT NOT NULL,
                started_by INTEGER NOT NULL,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (started_by) REFERENCES users (id)
            )`);

            // Seeding - Données de démonstration et d'initialisation
            const salt = bcrypt.genSaltSync(10);
            const hashedCoachPassword = bcrypt.hashSync('coach', salt);

            const bootstrapAdminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
            if (bootstrapAdminPassword) {
                const hashedAdminPassword = bcrypt.hashSync(bootstrapAdminPassword, salt);
                db.run(`INSERT INTO users (id, fullname, email, password, role)
                        VALUES (1, 'Administrateur FADY', 'admin@academiefady.com', ?, 'admin')
                        ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = 'admin'`,
                    [hashedAdminPassword]);
            } else {
                db.get('SELECT id, password FROM users WHERE email = ?', ['admin@academiefady.com'], (err, admin) => {
                    if (err) {
                        console.error('Erreur lors de la vérification du compte administrateur:', err.message);
                        return;
                    }
                    if (admin && bcrypt.compareSync('admin', admin.password)) {
                        db.run("UPDATE users SET role = 'player' WHERE id = ?", [admin.id], (updateError) => {
                            if (updateError) {
                                console.error('Impossible de désactiver le mot de passe administrateur par défaut:', updateError.message);
                                return;
                            }
                            console.warn('Le compte administrateur par défaut a été désactivé. Définissez ADMIN_BOOTSTRAP_PASSWORD pour le configurer.');
                        });
                    }
                });
            }

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
            db.run(`INSERT OR IGNORE INTO teams (id, name, category_id, coach_id) VALUES (1, 'U17 Régional', 1, 1)`);
            db.run(`INSERT OR IGNORE INTO teams (id, name, category_id, coach_id) VALUES (2, 'Seniors D1', 2, 2)`);
            db.run(`INSERT OR IGNORE INTO teams (id, name, category_id, coach_id) VALUES (3, 'U15 Régional', 3, 3)`);
            db.run(`UPDATE teams SET name = CASE name
                WHEN 'U10 Elite' THEN 'U17 Régional'
                WHEN 'U14 Élite' THEN 'Seniors D1'
                WHEN 'U18 Elite' THEN 'U15 Régional'
                END
                WHERE name IN ('U10 Elite', 'U14 Élite', 'U18 Elite')`);

            // 5. Entraînements (lundi, mercredi, vendredi, samedi)
            // Lundi
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (1, 1, 'Lundi', '10h00', '12h00', 'Terrain Sud')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (2, 2, 'Lundi', '16h30', '18h30', 'Terrain Nord')`);
            db.run(`INSERT OR IGNORE INTO trainings (id, team_id, day_of_week, start_time, end_time, location) VALUES (3, 3, 'Lundi', '19h00', '20h30', 'Terrain Principal')`);
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

            const trainingDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            const activeTrainingDays = new Set(['Lundi', 'Mercredi', 'Vendredi', 'Samedi']);
            const trainingDayStatement = db.prepare(
                'INSERT OR IGNORE INTO training_day_settings (day_of_week, is_active) VALUES (?, ?)'
            );
            trainingDays.forEach((day) => trainingDayStatement.run(day, activeTrainingDays.has(day) ? 1 : 0));
            trainingDayStatement.finalize();

            db.run(`UPDATE trainings SET location = CASE location
                WHEN 'Terrain Sud' THEN 'Terrain de Fadi'
                WHEN 'Terrain Nord' THEN 'Terrain de Tata'
                WHEN 'Terrain Principal' THEN 'Grand Stade Régional de Labé'
                ELSE location
            END
            WHERE location IN ('Terrain Sud', 'Terrain Nord', 'Terrain Principal')`);
            db.run(`UPDATE trainings SET start_time = '10h00', end_time = '12h00'
                    WHERE id = 1 AND day_of_week = 'Lundi' AND start_time = '17h00' AND end_time = '18h00'`);
            db.run(`UPDATE trainings SET start_time = '16h30', end_time = '18h30'
                    WHERE id = 2 AND day_of_week = 'Lundi' AND start_time = '18h30' AND end_time = '19h30'`);
            db.run(`UPDATE trainings SET start_time = '19h00', end_time = '20h30'
                    WHERE id = 3 AND day_of_week = 'Lundi' AND start_time = '20h00' AND end_time = '21h30'`);
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

function requireGalleryAdmin(req, res, next) {
    const authorization = req.get('Authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const session = gallerySessions.get(token);

    if (!session || session.expiresAt <= Date.now()) {
        if (token) gallerySessions.delete(token);
        return res.status(401).json({ message: 'Session administrateur expirée ou invalide. Reconnectez-vous.' });
    }

    db.get('SELECT id, role FROM users WHERE id = ?', [session.userId], (err, user) => {
        if (err) return res.status(500).json({ message: 'Impossible de vérifier les autorisations.' });
        if (!user || user.role !== 'admin') {
            gallerySessions.delete(token);
            return res.status(403).json({ message: 'Seul un administrateur peut gérer la galerie.' });
        }

        req.galleryAdmin = user;
        req.gallerySessionToken = token;
        next();
    });
}

// Route d'inscription utilisateur
app.post('/api/register', async (req, res) => {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, 'player')`;
        db.run(query, [fullname, email, hashedPassword], function(err) {
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

        const token = crypto.randomBytes(32).toString('hex');
        gallerySessions.set(token, {
            userId: user.id,
            expiresAt: Date.now() + gallerySessionLifetime
        });

        res.json({ 
            message: 'Connexion réussie !', 
            user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role },
            token
        });
    });
});

app.post('/api/logout', (req, res) => {
    const authorization = req.get('Authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (token) gallerySessions.delete(token);
    res.json({ message: 'Déconnexion réussie.' });
});

app.get('/api/directors', (req, res) => {
    db.all(`SELECT id, role, fullname, bio, photo_url
            FROM academy_directors ORDER BY id`, [], (error, directors) => {
        if (error) return res.status(500).json({ message: 'Impossible de charger les dirigeants.' });
        res.json(directors);
    });
});

const galleryMimeExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm'
};

const galleryUpload = multer({
    storage: multer.diskStorage({
        destination: galleryUploadDirectory,
        filename(req, file, callback) {
            callback(null, `${crypto.randomBytes(18).toString('hex')}${galleryMimeExtensions[file.mimetype]}`);
        }
    }),
    limits: { fileSize: 100 * 1024 * 1024, files: 10 },
    fileFilter(req, file, callback) {
        if (!galleryMimeExtensions[file.mimetype]) {
            return callback(new Error('Formats acceptés : JPG, PNG, WebP, MP4 ou WebM.'));
        }
        callback(null, true);
    }
});

function removeGalleryFiles(files) {
    for (const file of files) {
        fs.unlink(path.join(galleryUploadDirectory, file.filename), (error) => {
            if (error && error.code !== 'ENOENT') {
                console.error('Impossible de nettoyer un fichier média temporaire:', error.message);
            }
        });
    }
}

function handleGalleryUpload(req, res, next) {
    galleryUpload.array('media', 10)(req, res, (error) => {
        if (!error) return next();

        removeGalleryFiles(req.files || []);

        const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
            ? 'Chaque fichier doit faire moins de 100 Mo.'
            : error.message;
        res.status(status).json({ message });
    });
}

app.get('/api/gallery/media', (req, res) => {
    const { type, category } = req.query;
    if (type && !['photo', 'video'].includes(type)) {
        return res.status(400).json({ message: 'Type de média invalide.' });
    }
    if (category && !['match', 'training', 'other'].includes(category)) {
        return res.status(400).json({ message: 'Catégorie de média invalide.' });
    }

    const conditions = [];
    const parameters = [];
    if (type) {
        conditions.push('type = ?');
        parameters.push(type);
    }
    if (category) {
        conditions.push('category = ?');
        parameters.push(category);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    db.all(`SELECT id, title, type, category, file_name, mime_type, created_at
            FROM gallery_media ${where} ORDER BY created_at DESC, id DESC`, parameters, (err, media) => {
        if (err) return res.status(500).json({ message: 'Impossible de charger la galerie.' });
        res.json(media.map((item) => ({
            ...item,
            url: `/uploads/gallery/${encodeURIComponent(item.file_name)}`
        })));
    });
});

app.get('/api/gallery/live', (req, res) => {
    db.get(`SELECT title, platform, source_url, embed_url, started_at
            FROM gallery_live_stream WHERE id = 1`, [], (err, stream) => {
        if (err) return res.status(500).json({ message: 'Impossible de charger le direct.' });
        res.json(stream || null);
    });
});

app.get('/api/admin/gallery/session', requireGalleryAdmin, (req, res) => {
    res.json({ user: { id: req.galleryAdmin.id, role: req.galleryAdmin.role } });
});

app.post('/api/admin/gallery/media', requireGalleryAdmin, handleGalleryUpload, async (req, res) => {
    const title = String(req.body.title || '').trim();
    const type = req.body.type;
    const category = req.body.category;
    const files = req.files || [];

    if (!title || title.length > 120 || !['photo', 'video'].includes(type)
        || !['match', 'training', 'other'].includes(category) || files.length === 0) {
        removeGalleryFiles(files);
        return res.status(400).json({ message: 'Indiquez un titre, un type, une catégorie et au moins un fichier.' });
    }

    const expectedMimePrefix = type === 'photo' ? 'image/' : 'video/';
    if (files.some((file) => !file.mimetype.startsWith(expectedMimePrefix)
        || (type === 'photo' && file.size > 12 * 1024 * 1024))) {
        removeGalleryFiles(files);
        return res.status(400).json({
            message: type === 'photo'
                ? 'Choisissez uniquement des images JPG, PNG ou WebP de 12 Mo maximum.'
                : 'Choisissez uniquement des vidéos MP4 ou WebM de 100 Mo maximum.'
        });
    }

    try {
        await new Promise((resolve, reject) => {
            db.run('BEGIN IMMEDIATE', (err) => err ? reject(err) : resolve());
        });

        const createdMedia = [];
        for (const [index, file] of files.entries()) {
            const itemTitle = files.length > 1 ? `${title} (${index + 1})` : title;
            const mediaId = await new Promise((resolve, reject) => {
                db.run(`INSERT INTO gallery_media
                        (title, type, category, file_name, mime_type, file_size, created_by)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [itemTitle, type, category, file.filename, file.mimetype, file.size, req.galleryAdmin.id],
                    function(err) {
                        if (err) return reject(err);
                        resolve(this.lastID);
                    });
            });
            createdMedia.push({ id: mediaId, title: itemTitle, type, category });
        }

        await new Promise((resolve, reject) => {
            db.run('COMMIT', (err) => err ? reject(err) : resolve());
        });
        res.status(201).json({ message: 'Médias publiés dans la galerie.', media: createdMedia });
    } catch (error) {
        await new Promise((resolve) => {
            db.run('ROLLBACK', (rollbackError) => {
                if (rollbackError) console.error('Impossible d’annuler la transaction des médias:', rollbackError.message);
                resolve();
            });
        });
        removeGalleryFiles(files);
        console.error('Erreur lors de l’enregistrement des médias de la galerie:', error.message);
        res.status(500).json({ message: 'Impossible de publier les médias.' });
    }
});

app.delete('/api/admin/gallery/media/:id', requireGalleryAdmin, (req, res) => {
    const mediaId = Number(req.params.id);
    if (!Number.isSafeInteger(mediaId) || mediaId < 1) {
        return res.status(400).json({ message: 'Identifiant de média invalide.' });
    }

    db.get('SELECT file_name FROM gallery_media WHERE id = ?', [mediaId], (err, media) => {
        if (err) return res.status(500).json({ message: 'Impossible de charger le média.' });
        if (!media) return res.status(404).json({ message: 'Média introuvable.' });

        const filePath = path.join(galleryUploadDirectory, media.file_name);
        fs.unlink(filePath, (unlinkError) => {
            if (unlinkError && unlinkError.code !== 'ENOENT') {
                return res.status(500).json({ message: 'Impossible de supprimer le fichier média.' });
            }
            db.run('DELETE FROM gallery_media WHERE id = ?', [mediaId], (deleteError) => {
                if (deleteError) return res.status(500).json({ message: 'Impossible de supprimer le média.' });
                res.json({ message: 'Média supprimé.' });
            });
        });
    });
});

function createLiveEmbed(sourceUrl) {
    let url;
    try {
        url = new URL(sourceUrl);
    } catch {
        return null;
    }

    if (url.protocol !== 'https:') return null;

    const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
    if (youtubeHosts.has(url.hostname)) {
        const videoId = url.hostname === 'youtu.be'
            ? url.pathname.split('/').filter(Boolean)[0]
            : url.searchParams.get('v') || url.pathname.match(/^\/(?:live|embed|shorts)\/([^/]+)/)?.[1];
        if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
        return {
            platform: 'youtube',
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`
        };
    }

    const facebookHosts = new Set(['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch']);
    if (facebookHosts.has(url.hostname) && url.pathname.length > 1) {
        return {
            platform: 'facebook',
            embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.toString())}&show_text=false`
        };
    }

    return null;
}

app.put('/api/admin/gallery/live', requireGalleryAdmin, (req, res) => {
    const title = String(req.body.title || '').trim();
    const sourceUrl = String(req.body.url || '').trim();
    const embed = createLiveEmbed(sourceUrl);

    if (!title || title.length > 120 || !embed) {
        return res.status(400).json({
            message: 'Indiquez un titre et un lien de direct YouTube ou Facebook valide en HTTPS.'
        });
    }

    db.run(`INSERT INTO gallery_live_stream (id, title, platform, source_url, embed_url, started_by)
            VALUES (1, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                platform = excluded.platform,
                source_url = excluded.source_url,
                embed_url = excluded.embed_url,
                started_by = excluded.started_by,
                started_at = CURRENT_TIMESTAMP`,
        [title, embed.platform, sourceUrl, embed.embedUrl, req.galleryAdmin.id], (err) => {
            if (err) return res.status(500).json({ message: 'Impossible de démarrer le direct.' });
            res.status(201).json({ message: 'Le direct est publié.', platform: embed.platform });
        });
});

app.delete('/api/admin/gallery/live', requireGalleryAdmin, (req, res) => {
    db.run('DELETE FROM gallery_live_stream WHERE id = 1', [], (err) => {
        if (err) return res.status(500).json({ message: 'Impossible d’arrêter le direct.' });
        res.json({ message: 'Le direct est arrêté.' });
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
app.get('/api/training-days', (req, res) => {
    db.all(`SELECT day_of_week, is_active
            FROM training_day_settings
            ORDER BY CASE day_of_week
                WHEN 'Lundi' THEN 1 WHEN 'Mardi' THEN 2 WHEN 'Mercredi' THEN 3
                WHEN 'Jeudi' THEN 4 WHEN 'Vendredi' THEN 5 WHEN 'Samedi' THEN 6
                WHEN 'Dimanche' THEN 7 ELSE 8 END`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Impossible de charger les jours d’entraînement.' });
        res.json(rows);
    });
});

app.get('/api/trainings', (req, res) => {
    const query = `
        SELECT tr.id, tr.day_of_week, tr.start_time, tr.end_time, tr.location,
               COALESCE(settings.is_active, 0) AS is_active, t.name AS team_name
        FROM trainings tr
        LEFT JOIN teams t ON tr.team_id = t.id
        LEFT JOIN training_day_settings settings ON settings.day_of_week = tr.day_of_week
        ORDER BY CASE tr.day_of_week
            WHEN 'Lundi' THEN 1 WHEN 'Mardi' THEN 2 WHEN 'Mercredi' THEN 3
            WHEN 'Jeudi' THEN 4 WHEN 'Vendredi' THEN 5 WHEN 'Samedi' THEN 6
            WHEN 'Dimanche' THEN 7 ELSE 8 END, tr.start_time
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.put('/api/admin/training-days', isAdmin, (req, res) => {
    const { day_of_week, is_active } = req.body;
    const validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    if (!validDays.includes(day_of_week) || typeof is_active !== 'boolean') {
        return res.status(400).json({ message: 'Jour ou état du calendrier invalide.' });
    }

    db.run(`INSERT INTO training_day_settings (day_of_week, is_active) VALUES (?, ?)
            ON CONFLICT(day_of_week) DO UPDATE SET is_active = excluded.is_active`,
        [day_of_week, is_active ? 1 : 0], (err) => {
            if (err) return res.status(500).json({ message: 'Impossible de modifier ce jour du calendrier.' });
            res.json({ message: `${day_of_week} ${is_active ? 'activé' : 'désactivé'} dans le calendrier.` });
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
    const validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const validLocations = ['Grand Stade Régional de Labé', 'Terrain de Tata', 'Terrain de Fadi'];
    if (!validDays.includes(day_of_week) || !validLocations.includes(location)
        || !Number.isSafeInteger(Number(team_id)) || !start_time || !end_time) {
        return res.status(400).json({ message: 'Vérifiez le jour, l’équipe, les horaires et le terrain.' });
    }

    db.run('INSERT INTO trainings (team_id, day_of_week, start_time, end_time, location) VALUES (?, ?, ?, ?, ?)',
        [team_id, day_of_week, start_time, end_time, location], function(err) {
            if (err) return res.status(500).json({ message: 'Erreur lors de l\'ajout du créneau.' });
            const trainingId = this.lastID;
            db.run(`INSERT INTO training_day_settings (day_of_week, is_active) VALUES (?, 1)
                    ON CONFLICT(day_of_week) DO UPDATE SET is_active = 1`, [day_of_week], (settingsError) => {
                if (settingsError) {
                    console.error('Créneau ajouté, mais impossible d’activer le jour du calendrier:', settingsError.message);
                    return res.status(500).json({ message: 'Le créneau a été ajouté, mais le jour n’a pas pu être activé.' });
                }
                res.status(201).json({ message: 'Créneau d’entraînement ajouté !', trainingId });
            });
        });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
