const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/* ──────────────────────────────────────────
   GET /api/stats
   Retorna inscritos, promedio y # reseñas
   por cada curso.
────────────────────────────────────────── */
app.get('/api/stats', (req, res) => {
    res.json(db.getStats());
});

/* ──────────────────────────────────────────
   POST /api/enroll
   Registra una inscripción.
────────────────────────────────────────── */
app.post('/api/enroll', (req, res) => {
    const { course_id, full_name, email, phone, city, country, occupation, payment_method } = req.body;

    if (!course_id || !full_name || !email || !phone || !city || !payment_method) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    if (![1, 2, 3].includes(Number(course_id))) {
        return res.status(400).json({ error: 'Curso inválido.' });
    }
    if (db.findEnrollment(Number(course_id), email)) {
        return res.status(409).json({ error: 'Este correo ya está inscrito en este curso.' });
    }

    const result = db.insertEnrollment({
        course_id: Number(course_id), full_name, email, phone,
        city, country: country || 'Colombia',
        occupation: occupation || '', payment_method
    });

    res.status(201).json(result);
});

/* ──────────────────────────────────────────
   GET /api/reviews?courseId=N
   Lista de reseñas de un curso.
────────────────────────────────────────── */
app.get('/api/reviews', (req, res) => {
    const courseId = Number(req.query.courseId);
    if (!courseId) return res.status(400).json({ error: 'courseId requerido.' });
    res.json(db.getReviews(courseId));
});

/* ──────────────────────────────────────────
   POST /api/reviews
   Publica una reseña.
────────────────────────────────────────── */
app.post('/api/reviews', (req, res) => {
    const { course_id, reviewer_name, email, rating, comment } = req.body;

    if (!course_id || !reviewer_name || !email || !rating || !comment) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'El rating debe estar entre 1 y 5.' });
    }
    if (db.findReview(Number(course_id), email)) {
        return res.status(409).json({ error: 'Ya dejaste una reseña para este curso.' });
    }

    const result = db.insertReview({
        course_id: Number(course_id), reviewer_name, email,
        rating: Number(rating), comment
    });

    res.status(201).json(result);
});

app.listen(PORT, () => {
    console.log(`\n🧠 VinculosCO corriendo en http://localhost:${PORT}\n`);
});
