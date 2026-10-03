const CLASS_ID = 'english-speaking-lab';
const allowedSteps = new Set(['listening', 'speaking', 'dialogue', 'review']);
const allowedLessons = new Set(['airport', 'campus', 'opinion']);

const json = (value, status = 200, headers = {}) => new Response(JSON.stringify(value), {
  status,
  headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers},
});

function cookies(request) {
  return Object.fromEntries((request.headers.get('cookie') || '').split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(pair => pair.length === 2));
}

function b64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function safeEqual(a, b) {
  const left = new TextEncoder().encode(a || '');
  const right = new TextEncoder().encode(b || '');
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) result |= left[i] ^ right[i];
  return result === 0;
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 120000}, material, 256));
}

async function signedCookie(name, request, env) {
  const raw = cookies(request)[name];
  if (!raw) return null;
  const split = raw.lastIndexOf('.');
  if (split < 1) return null;
  const value = raw.slice(0, split), signature = raw.slice(split + 1);
  return await safeEqual(signature, await sign(`${name}:${value}`, env.SESSION_SECRET)) ? value : null;
}

async function accountSession(request, env) {
  const value = await signedCookie('kouyu_account', request, env);
  if (!value) return null;
  const [id, role, expires] = value.split(':');
  if (!id || !['student', 'teacher'].includes(role) || Number(expires) <= Date.now()) return null;
  const account = await env.DB.prepare(`SELECT id,username,role,display_name,class_id,student_id,teacher_id
    FROM accounts WHERE id=? AND role=? AND status='active'`).bind(id, role).first();
  return account || null;
}

async function studentSession(request, env) {
  const account = await accountSession(request, env);
  let id = account?.role === 'student' ? account.student_id : await signedCookie('kouyu_student', request, env), fresh = false;
  if (!id) { id = crypto.randomUUID(); fresh = true; }
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO students (id,class_id,display_name,created_at,last_seen_at)
    VALUES (?,?,'学习者',?,?) ON CONFLICT(id) DO UPDATE SET last_seen_at=excluded.last_seen_at`).bind(id, CLASS_ID, now, now).run();
  await env.DB.prepare(`INSERT OR IGNORE INTO student_profiles (student_id,active_lesson,words_json,updated_at) VALUES (?,'airport','[]',?)`).bind(id, now).run();
  const value = `${id}.${await sign(`kouyu_student:${id}`, env.SESSION_SECRET)}`;
  return {id, cookie: fresh ? `kouyu_student=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000` : null};
}

async function isTeacher(request, env) {
  const account = await accountSession(request, env);
  if (account?.role === 'teacher') return true;
  const expires = await signedCookie('kouyu_teacher', request, env);
  return Boolean(expires && Number(expires) > Date.now());
}

function requireSameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function bootstrap(request, env) {
  const student = await studentSession(request, env);
  const account = await accountSession(request, env);
  const teacher = await isTeacher(request, env);
  const teacherView = new URL(request.url).searchParams.get('view') === 'teacher' && teacher;
  const [profile, progress, tasks, drafts, submissions, grades] = await Promise.all([
    env.DB.prepare('SELECT diagnostic_json,active_lesson,words_json FROM student_profiles WHERE student_id=?').bind(student.id).first(),
    env.DB.prepare('SELECT lesson_id,step FROM learning_progress WHERE student_id=?').bind(student.id).all(),
    env.DB.prepare("SELECT id,lesson_id,title,instruction,due_at,created_by FROM tasks WHERE class_id=? AND status='published' ORDER BY created_at DESC").bind(CLASS_ID).all(),
    teacherView
      ? env.DB.prepare(`SELECT d.id,d.lesson_id,d.prompt_text,d.duration_seconds,d.reflection,d.created_at,s.display_name AS student_name
          FROM drafts d JOIN students s ON s.id=d.student_id WHERE s.class_id=? ORDER BY d.created_at DESC`).bind(CLASS_ID).all()
      : env.DB.prepare('SELECT id,lesson_id,prompt_text,duration_seconds,reflection,created_at FROM drafts WHERE student_id=? ORDER BY created_at DESC').bind(student.id).all(),
    teacherView
      ? env.DB.prepare(`SELECT h.id,h.task_id,h.draft_id,h.submitted_at FROM homework_submissions h
          JOIN students s ON s.id=h.student_id WHERE s.class_id=?`).bind(CLASS_ID).all()
      : env.DB.prepare('SELECT id,task_id,draft_id,submitted_at FROM homework_submissions WHERE student_id=?').bind(student.id).all(),
    teacherView
      ? env.DB.prepare(`SELECT g.offset_seconds,g.feedback,g.created_at,h.draft_id FROM grading_results g
          JOIN homework_submissions h ON h.id=g.submission_id JOIN students s ON s.id=h.student_id WHERE s.class_id=?`).bind(CLASS_ID).all()
      : env.DB.prepare(`SELECT g.offset_seconds,g.feedback,g.created_at,s.draft_id FROM grading_results g
          JOIN homework_submissions s ON s.id=g.submission_id WHERE s.student_id=?`).bind(student.id).all(),
  ]);
  const progressMap = {};
  for (const row of progress.results) progressMap[row.lesson_id] = {...progressMap[row.lesson_id], [row.step]: true};
  const submissionsByDraft = Object.fromEntries(submissions.results.map(row => [row.draft_id, row]));
  const reviews = {};
  for (const row of grades.results) reviews[row.draft_id] = {at: row.offset_seconds, text: row.feedback, created: row.created_at};
  for (const row of drafts.results) if (row.reflection) reviews[`self-${row.id}`] = {text: row.reflection, created: row.created_at};
  const state = {
    version: 2,
    diagnostic: profile?.diagnostic_json ? JSON.parse(profile.diagnostic_json) : null,
    activeLesson: allowedLessons.has(profile?.active_lesson) ? profile.active_lesson : 'airport',
    progress: progressMap,
    words: JSON.parse(profile?.words_json || '[]'),
    records: drafts.results.map(row => ({id: row.id, lesson: row.lesson_id, text: row.prompt_text, duration: row.duration_seconds, created: row.created_at, student: row.student_name, submitted: Boolean(submissionsByDraft[row.id]), task: submissionsByDraft[row.id]?.task_id})),
    reviews,
    tasks: tasks.results.map(row => ({id: row.id, lesson: row.lesson_id, title: row.title, instruction: row.instruction, due: row.due_at || '', group: '英语口语练习班', published: true, sample: row.created_by === 'system'})),
  };
  return json({state, session: {teacher, account: account ? {username: account.username, role: account.role, displayName: account.display_name} : null, view: teacherView ? 'teacher' : 'student', storage: 'd1'}}, 200, student.cookie ? {'set-cookie': student.cookie} : {});
}

async function handleEvent(request, env) {
  const student = await studentSession(request, env);
  const action = await request.json();
  const now = Date.now();
  if (!action || typeof action.type !== 'string') return json({error: 'invalid_action'}, 400);
  if (action.type === 'select' && allowedLessons.has(action.id)) {
    await env.DB.prepare('UPDATE student_profiles SET active_lesson=?,updated_at=? WHERE student_id=?').bind(action.id, now, student.id).run();
  } else if (action.type === 'diagnose' && action.value && typeof action.value === 'object') {
    const lesson = action.value.goal === 'campus' ? 'campus' : action.value.confidence === 'comfortable' && action.value.answer === 'window' ? 'opinion' : 'airport';
    await env.DB.prepare('UPDATE student_profiles SET diagnostic_json=?,active_lesson=?,updated_at=? WHERE student_id=?').bind(JSON.stringify(action.value), lesson, now, student.id).run();
  } else if (action.type === 'progress' && allowedLessons.has(action.lesson) && allowedSteps.has(action.step)) {
    await env.DB.prepare('INSERT OR IGNORE INTO learning_progress (student_id,lesson_id,step,completed_at) VALUES (?,?,?,?)').bind(student.id, action.lesson, action.step, now).run();
  } else if (action.type === 'word' && typeof action.word === 'string' && action.word.length <= 80) {
    const row = await env.DB.prepare('SELECT words_json FROM student_profiles WHERE student_id=?').bind(student.id).first();
    const words = new Set(JSON.parse(row?.words_json || '[]'));
    words.has(action.word) ? words.delete(action.word) : words.add(action.word);
    await env.DB.prepare('UPDATE student_profiles SET words_json=?,updated_at=? WHERE student_id=?').bind(JSON.stringify([...words]), now, student.id).run();
  } else if (action.type === 'record' && action.record && allowedLessons.has(action.record.lesson)) {
    const record = action.record;
    await env.DB.prepare(`INSERT INTO drafts (id,student_id,lesson_id,prompt_text,duration_seconds,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`).bind(record.id, student.id, record.lesson, String(record.text || '').slice(0, 500), Math.max(1, Math.min(120, Number(record.duration) || 1)), Number(record.created) || now, now).run();
  } else if (action.type === 'submit') {
    const draft = await env.DB.prepare('SELECT lesson_id FROM drafts WHERE id=? AND student_id=?').bind(action.id, student.id).first();
    const task = await env.DB.prepare("SELECT lesson_id FROM tasks WHERE id=? AND status='published'").bind(action.task).first();
    if (!draft || !task || draft.lesson_id !== task.lesson_id) return json({error: 'submission_mismatch'}, 409);
    await env.DB.prepare(`INSERT INTO homework_submissions (id,task_id,draft_id,student_id,status,submitted_at)
      VALUES (?,?,?,?, 'submitted', ?) ON CONFLICT(task_id,draft_id) DO UPDATE SET submitted_at=excluded.submitted_at`).bind(crypto.randomUUID(), action.task, action.id, student.id, now).run();
  } else if (action.type === 'review' && String(action.id).startsWith('self-')) {
    const draftId = String(action.id).slice(5);
    await env.DB.prepare('UPDATE drafts SET reflection=?,updated_at=? WHERE id=? AND student_id=?').bind(String(action.review?.text || '').slice(0, 1000), now, draftId, student.id).run();
  } else if (action.type === 'task') {
    if (!await isTeacher(request, env)) return json({error: 'teacher_auth_required'}, 401);
    const task = action.task || {};
    if (!task.id || !task.title || !task.instruction || !allowedLessons.has(task.lesson)) return json({error: 'invalid_task'}, 400);
    await env.DB.prepare(`INSERT INTO tasks (id,class_id,lesson_id,title,instruction,due_at,status,created_by,created_at)
      VALUES (?,?,?,?,?,?,'published','teacher',?)`).bind(task.id, CLASS_ID, task.lesson, String(task.title).slice(0, 80), String(task.instruction).slice(0, 1000), task.due || null, now).run();
  } else if (action.type === 'review') {
    if (!await isTeacher(request, env)) return json({error: 'teacher_auth_required'}, 401);
    const submission = await env.DB.prepare('SELECT id FROM homework_submissions WHERE draft_id=?').bind(action.id).first();
    if (!submission) return json({error: 'submission_not_found'}, 404);
    const review = action.review || {};
    await env.DB.prepare(`INSERT INTO grading_results (id,submission_id,teacher_id,offset_seconds,feedback,created_at,updated_at)
      VALUES (?,?, 'teacher', ?,?,?,?) ON CONFLICT(submission_id) DO UPDATE SET offset_seconds=excluded.offset_seconds,feedback=excluded.feedback,updated_at=excluded.updated_at`).bind(crypto.randomUUID(), submission.id, Math.max(0, Number(review.at) || 0), String(review.text || '').slice(0, 1000), now, now).run();
  } else {
    return json({error: 'unsupported_action'}, 400);
  }
  return json({ok: true}, 200, student.cookie ? {'set-cookie': student.cookie} : {});
}

async function teacherLogin(request, env) {
  const {token = ''} = await request.json();
  if (!await safeEqual(await sign(token, env.SESSION_SECRET), await sign(env.TEACHER_TOKEN, env.SESSION_SECRET))) return json({error: 'invalid_teacher_token'}, 401);
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const value = `${expires}.${await sign(`kouyu_teacher:${expires}`, env.SESSION_SECRET)}`;
  return json({ok: true, expires}, 200, {'set-cookie': `kouyu_teacher=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
}

async function accountLogin(request, env) {
  const {username = '', password = ''} = await request.json();
  if (!username.trim() || !password || username.length > 80 || password.length > 200) return json({error: 'invalid_credentials'}, 401);
  const account = await env.DB.prepare(`SELECT id,username,password_salt,password_hash,role,display_name
    FROM accounts WHERE username=? COLLATE NOCASE AND status='active'`).bind(username.trim()).first();
  const candidate = await passwordHash(password, account?.password_salt || 'invalid-account-salt');
  if (!account || !await safeEqual(candidate, account.password_hash)) return json({error: 'invalid_credentials'}, 401);
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  const value = `${account.id}:${account.role}:${expires}`;
  const signed = `${value}.${await sign(`kouyu_account:${value}`, env.SESSION_SECRET)}`;
  return json({ok: true, account: {username: account.username, role: account.role, displayName: account.display_name}, expires}, 200, {
    'set-cookie': `kouyu_account=${encodeURIComponent(signed)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
  });
}

async function aiFeedback(request, env) {
  if (!env.SILICONFLOW_API_KEY) return json({error: 'siliconflow_not_configured'}, 503);
  const {text = '', context = ''} = await request.json();
  if (!text.trim() || text.length > 2000) return json({error: 'invalid_text'}, 400);
  const upstream = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {'authorization': `Bearer ${env.SILICONFLOW_API_KEY}`, 'content-type': 'application/json'},
    body: JSON.stringify({model: 'Qwen/Qwen2.5-7B-Instruct', temperature: 0.3, messages: [
      {role: 'system', content: '你是谨慎的英语口语教练。只针对文字表达给出简短、可执行的建议，不虚构发音或流利度评分。'},
      {role: 'user', content: `场景：${context}\n表达：${text}`},
    ]}),
  });
  if (!upstream.ok) return json({error: 'ai_upstream_error'}, 502);
  const result = await upstream.json();
  return json({feedback: result.choices?.[0]?.message?.content || ''});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        await env.DB.prepare('SELECT 1 AS ok').first();
        return json({ok: true, runtime: 'cloudflare-worker', database: 'd1'});
      }
      if (url.pathname === '/api/bootstrap' && request.method === 'GET') return bootstrap(request, env);
      if (!requireSameOrigin(request) && request.method !== 'GET') return json({error: 'invalid_origin'}, 403);
      if (url.pathname === '/api/auth/login' && request.method === 'POST') return accountLogin(request, env);
      if (url.pathname === '/api/auth/teacher' && request.method === 'POST') return teacherLogin(request, env);
      if (url.pathname === '/api/auth/session' && request.method === 'DELETE') return json({ok: true}, 200, {'set-cookie': 'kouyu_account=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
      if (url.pathname === '/api/events' && request.method === 'POST') return handleEvent(request, env);
      if (url.pathname === '/api/ai/feedback' && request.method === 'POST') return aiFeedback(request, env);
      if (url.pathname.startsWith('/api/')) return json({error: 'not_found'}, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({error: 'internal_error'}, 500);
    }
  },
};
