const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function load() {
    if (!fs.existsSync(DB_PATH)) return { enrollments: [], reviews: [] };
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
    catch { return { enrollments: [], reviews: [] }; }
}

function save(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function seed() {
    const data = load();
    if (data.enrollments.length === 0) {
        data.enrollments = [
            { id:1, course_id:1, full_name:'Laura Martínez',  email:'laura@m.com',  phone:'3001234567', city:'Bogotá',       country:'Colombia', occupation:'Psicóloga',          payment_method:'nequi',     created_at: new Date().toISOString() },
            { id:2, course_id:1, full_name:'Pedro González',  email:'pedro@g.com',  phone:'3109876543', city:'Medellín',     country:'Colombia', occupation:'Estudiante',          payment_method:'card',      created_at: new Date().toISOString() },
            { id:3, course_id:2, full_name:'Ana Torres',      email:'ana@t.com',    phone:'3152345678', city:'Cali',         country:'Colombia', occupation:'Trabajadora social',  payment_method:'nequi',     created_at: new Date().toISOString() },
            { id:4, course_id:2, full_name:'Diego Ramírez',   email:'diego@r.com',  phone:'3006543210', city:'Barranquilla', country:'Colombia', occupation:'Docente',             payment_method:'card',      created_at: new Date().toISOString() },
            { id:5, course_id:3, full_name:'Isabella Castro', email:'isa@c.com',    phone:'3204321098', city:'Bucaramanga',  country:'Colombia', occupation:'Psicóloga',           payment_method:'daviplata', created_at: new Date().toISOString() },
        ];
    }
    if (data.reviews.length === 0) {
        data.reviews = [
            { id:1, course_id:1, reviewer_name:'Mariana López',   email:'mariana@email.com', rating:5, comment:'Excelente curso, cambió mi perspectiva sobre el trabajo comunitario. Muy recomendado.', created_at: new Date().toISOString() },
            { id:2, course_id:2, reviewer_name:'Carlos Herrera',  email:'carlos@email.com',  rating:5, comment:'La instructora explica de forma muy clara. Los ejemplos prácticos son increíbles.',    created_at: new Date().toISOString() },
            { id:3, course_id:3, reviewer_name:'Sofía Rodríguez', email:'sofia@email.com',   rating:4, comment:'Muy buen contenido, aprendí herramientas que apliqué de inmediato en mi trabajo.',     created_at: new Date().toISOString() },
            { id:4, course_id:1, reviewer_name:'Valentina Ríos',  email:'vale@email.com',    rating:5, comment:'Nunca había tomado un curso tan completo. La metodología es única y muy efectiva.',    created_at: new Date().toISOString() },
        ];
    }
    save(data);
}

seed();

// ── Helpers ────────────────────────────────────────────────

function nextId(arr) {
    return arr.length === 0 ? 1 : Math.max(...arr.map(r => r.id)) + 1;
}

function fmtDate(iso) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// ── Public API (mirrors better-sqlite3 surface used by server.js) ──

const db = {

    getStats() {
        const data = load();
        return [1, 2, 3].map(courseId => {
            const enrolled = data.enrollments.filter(e => e.course_id === courseId).length;
            const revs     = data.reviews.filter(r => r.course_id === courseId);
            const avg      = revs.length ? +(revs.reduce((s,r) => s + r.rating, 0) / revs.length).toFixed(1) : 0;
            return { course_id: courseId, enrolled, review_count: revs.length, avg_rating: avg };
        });
    },

    findEnrollment(courseId, email) {
        const data = load();
        return data.enrollments.find(e => e.course_id === courseId && e.email === email) || null;
    },

    insertEnrollment(rec) {
        const data = load();
        const id = nextId(data.enrollments);
        data.enrollments.push({ id, ...rec, created_at: new Date().toISOString() });
        save(data);
        const enrolled = data.enrollments.filter(e => e.course_id === rec.course_id).length;
        return { id, enrolled };
    },

    getReviews(courseId) {
        const data = load();
        return data.reviews
            .filter(r => r.course_id === courseId)
            .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
            .map(r => ({ ...r, date: fmtDate(r.created_at) }));
    },

    findReview(courseId, email) {
        const data = load();
        return data.reviews.find(r => r.course_id === courseId && r.email === email) || null;
    },

    insertReview(rec) {
        const data = load();
        const id = nextId(data.reviews);
        data.reviews.push({ id, ...rec, created_at: new Date().toISOString() });
        save(data);
        const revs = data.reviews.filter(r => r.course_id === rec.course_id);
        const avg  = +(revs.reduce((s,r) => s + r.rating, 0) / revs.length).toFixed(1);
        return { id, avg, count: revs.length };
    }
};

module.exports = db;
