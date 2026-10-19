// Exercise the academy data layer against the local seeded DB.
import Database from "better-sqlite3";
import { createHash } from "node:crypto";

const db = new Database("data/ghbc.db");
const ok = (label, cond) => console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);

// 1. Catalog shape
const certs = db.prepare("SELECT id, slug, title, is_free, exam_questions, exam_pass_percent FROM certifications ORDER BY sort_order").all();
ok("4 certifications", certs.length === 4);
ok("free cert first", certs[0].is_free === 1);

// 2. Course/lesson tree for the free cert
const free = db.prepare("SELECT id FROM certifications WHERE slug='gs1207_core'").get();
const courseCount = db.prepare("SELECT COUNT(*) n FROM academy_courses WHERE certification_id=?").get(free.id).n;
const lessonCount = db.prepare("SELECT COUNT(*) n FROM academy_lessons l JOIN academy_courses c ON c.id=l.course_id WHERE c.certification_id=?").get(free.id).n;
ok("free cert has courses", courseCount > 0);
ok("free cert has lessons", lessonCount > 0);

// 3. Every exam-eligible question has provenance
const noProv = db.prepare("SELECT COUNT(*) n FROM academy_questions WHERE is_exam_eligible=1 AND (clause_id IS NULL OR content_hash IS NULL)").get().n;
ok("all exam-eligible questions carry provenance", noProv === 0);

// 4. correct_index always in bounds
const oob = db.prepare("SELECT COUNT(*) n FROM academy_questions WHERE correct_index < 0 OR correct_index > json_array_length(options_json)-1").get().n;
ok("no out-of-bounds answer keys", oob === 0);

// 5. Exam picks are available and unique
const exam = db.prepare("SELECT id FROM academy_questions WHERE is_exam_eligible=1 ORDER BY RANDOM() LIMIT 30").all();
ok("30 exam questions available", exam.length === 30);
ok("exam picks unique", new Set(exam.map((e) => e.id)).size === exam.length);

// 6. Simulate full enrollment -> progress -> exam -> certificate cycle
const userId = "user_test_academy";
db.prepare("INSERT OR IGNORE INTO users (id, email, password_hash, name, role, plan) VALUES (?,?,?,?,?,?)").run(userId, "t@example.com", null, "Test Learner", "user", "free");
db.prepare("DELETE FROM academy_enrollments WHERE user_id=?").run(userId);

const enrId = "enr_test";
db.prepare("INSERT INTO academy_enrollments (id, user_id, certification_id, status) VALUES (?,?,?,'active')").run(enrId, userId, free.id);
ok("enrollment created", !!db.prepare("SELECT 1 FROM academy_enrollments WHERE id=?").get(enrId));

const firstLesson = db.prepare("SELECT l.id FROM academy_lessons l JOIN academy_courses c ON c.id=l.course_id WHERE c.certification_id=? LIMIT 1").get(free.id);
db.prepare("INSERT OR REPLACE INTO academy_lesson_progress (id, enrollment_id, lesson_id, completed_at) VALUES ('p1',?,?,datetime('now'))").run(enrId, firstLesson.id);
ok("lesson progress recorded", !!db.prepare("SELECT 1 FROM academy_lesson_progress WHERE enrollment_id=?").get(enrId));

// 7. Certificate insertion + public verify query
const issuedAt = new Date().toISOString();
const verifyHash = createHash("sha256").update(`GHBC|${userId}|gs1207_core|${issuedAt}`).digest("hex");
const serial = `GHBC-2026-${verifyHash.slice(0, 10).toUpperCase()}`;
db.prepare("INSERT OR REPLACE INTO academy_certificates (id, user_id, certification_id, serial, recipient_name, verify_hash) VALUES ('cert_test',?,?,?,?,?)").run(userId, free.id, serial, "Test Learner", verifyHash);
const verified = db.prepare("SELECT c.serial, c.recipient_name, cert.title FROM academy_certificates c JOIN certifications cert ON cert.id=c.certification_id WHERE c.serial=?").get(serial);
ok("certificate publicly verifiable", !!verified && verified.serial === serial);

// cleanup test rows
db.prepare("DELETE FROM academy_certificates WHERE id='cert_test'").run();
db.prepare("DELETE FROM academy_lesson_progress WHERE enrollment_id=?").run(enrId);
db.prepare("DELETE FROM academy_enrollments WHERE id=?").run(enrId);
db.prepare("DELETE FROM users WHERE id=?").run(userId);

console.log("\nDone.");
