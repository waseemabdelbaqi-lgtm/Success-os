/**
 * Elementary AI Teacher Studio — HeyGen / Synthesia production path.
 * Preview slides + TTS are NOT the product ceiling; this is.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  isProviderConfigured,
  providerRegistry,
  AI_TASKS,
} from '../ai/provider-registry.js';
import { avatarVideoStatus, createAvatarVideo } from '../ai/orchestrator.js';
import { withAiAssistantTitle } from './ai-assistant-teacher.js';
import { geminiReady, runGeminiLessonRebuild } from './gemini-lesson-producer.js';

const ROOT = process.cwd();
const JOBS_DIR = path.join(ROOT, '.data', 'elementary-studio-jobs');

const LESSONS = Object.freeze({
  'jordan-g1-math-number-line-addition': {
    slug: 'jordan-g1-math-number-line-addition',
    titleAr: 'الجمع باستعمال خط الأعداد',
    teacherName: withAiAssistantTitle('أ. لاما النوري'),
    scriptsDir: 'public/ai-lessons/g1-math/scripts',
    manifestPath: 'public/ai-lessons/g1-math/manifest.json',
    previewVideo: '/ai-lessons/g1-math',
    interactiveRoute: '/ai-lessons/g1-math',
    archivedSlideshow: '/ai-lessons/g1-math/media/archived-slideshow.mp4',
  },
});

function ensureJobsDir() {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
  return JOBS_DIR;
}

function jobPath(slug) {
  return path.join(ensureJobsDir(), `${slug}.json`);
}

function readJob(slug) {
  const p = jobPath(slug);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeJob(slug, data) {
  fs.writeFileSync(jobPath(slug), JSON.stringify(data, null, 2), 'utf8');
  return data;
}

export function studioProviderStatus() {
  const avatar = providerRegistry.filter((p) => p.tasks.includes(AI_TASKS.AVATAR_VIDEO));
  const voice = providerRegistry.filter((p) => p.tasks.includes(AI_TASKS.VOICE));
  const readyAvatar = avatar.filter((p) => isProviderConfigured(p) && p.implemented?.includes(AI_TASKS.AVATAR_VIDEO));
  const gemini = geminiReady();
  return {
    ceiling: 'gemini-plus-heygen',
    messageAr:
      'المسار الأقوى الآن: 1) GEMINI_API_KEY لإعادة بناء السكربت والصور بجودة أعلى 2) HEYGEN_* لمعلّمة حقيقية تتحرك. بدون المفاتيح تبقى المعاينة المحلية ضعيفة.',
    required: {
      gemini: ['GEMINI_API_KEY'],
      recommended: ['HEYGEN_API_KEY', 'HEYGEN_AVATAR_ID', 'HEYGEN_VOICE_ID'],
      alternative: ['SYNTHESIA_API_KEY', 'SYNTHESIA_AVATAR_ID'],
      optionalVoiceUpgrade: ['ELEVENLABS_API_KEY'],
    },
    gemini: { configured: gemini, operational: gemini, env: ['GEMINI_API_KEY'] },
    providers: {
      avatar: avatar.map((p) => ({
        id: p.id,
        label: p.label,
        configured: isProviderConfigured(p),
        operational: isProviderConfigured(p) && Boolean(p.implemented?.includes(AI_TASKS.AVATAR_VIDEO)),
        env: p.env,
      })),
      voice: voice.map((p) => ({
        id: p.id,
        label: p.label,
        configured: isProviderConfigured(p),
        env: p.env,
      })),
    },
    ready: readyAvatar.length > 0,
    geminiReady: gemini,
    activeProvider: readyAvatar[0]?.id || null,
  };
}

function loadScript(lesson) {
  const dir = path.join(ROOT, lesson.scriptsDir);
  if (!fs.existsSync(dir)) {
    throw new Error('SCRIPT_PACK_MISSING');
  }
  const parts = fs
    .readdirSync(dir)
    .filter((f) => /^beat-\d+\.txt$/i.test(f))
    .sort()
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8').trim())
    .filter(Boolean);
  if (!parts.length) throw new Error('SCRIPT_PACK_EMPTY');
  const intro = `مرحبا، أنا ${lesson.teacherName}. هذه حصة الصف الأول من Success OS.`;
  const script = [intro, ...parts].join('\n\n');
  const words = script.split(/\s+/).filter(Boolean).length;
  return { script, words, estimatedMinutes: Math.max(3, Math.ceil(words / 130)), parts: parts.length };
}

export function getElementaryStudioSnapshot(slug = 'jordan-g1-math-number-line-addition') {
  const lesson = LESSONS[slug];
  if (!lesson) return { error: 'UNKNOWN_LESSON', status: studioProviderStatus() };
  const job = readJob(slug);
  let scriptMeta = null;
  try {
    scriptMeta = loadScript(lesson);
    scriptMeta = { words: scriptMeta.words, estimatedMinutes: scriptMeta.estimatedMinutes, parts: scriptMeta.parts };
  } catch (e) {
    scriptMeta = { error: e.message };
  }
  return {
    lesson: {
      slug: lesson.slug,
      titleAr: lesson.titleAr,
      teacherName: lesson.teacherName,
      teacherTitle: 'معلّمة مساعدة',
      previewVideo: lesson.previewVideo,
    },
    script: scriptMeta,
    job,
    studio: studioProviderStatus(),
  };
}

export async function produceElementaryStudioVideo(slug = 'jordan-g1-math-number-line-addition') {
  const lesson = LESSONS[slug];
  if (!lesson) throw Object.assign(new Error('UNKNOWN_LESSON'), { status: 404 });
  const status = studioProviderStatus();
  if (!status.ready) {
    throw Object.assign(new Error('NO_AVATAR_PROVIDER_CONFIGURED'), {
      status: 503,
      required: status.required,
      messageAr: status.messageAr,
    });
  }
  const { script, words, estimatedMinutes, parts } = loadScript(lesson);
  const video = await createAvatarVideo({
    script,
    title: `${lesson.titleAr} — ${lesson.teacherName}`,
    language: 'ar',
    preferred: status.activeProvider ? [status.activeProvider] : ['heygen', 'synthesia'],
  });
  const job = writeJob(slug, {
    slug,
    teacherName: lesson.teacherName,
    teacherTitle: 'معلّمة مساعدة',
    provider: video.provider,
    id: video.id,
    status: video.status || 'processing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    words,
    estimatedMinutes,
    parts,
    videoUrl: '',
    thumbnailUrl: '',
  });
  return { job, studio: status, attempts: video.attempts || [] };
}

export async function rebuildWithGemini(steps = ['all']) {
  return runGeminiLessonRebuild({ steps });
}

export async function refreshElementaryStudioJob(slug = 'jordan-g1-math-number-line-addition') {
  const job = readJob(slug);
  if (!job?.id || !job?.provider) {
    throw Object.assign(new Error('NO_JOB'), { status: 404 });
  }
  const live = await avatarVideoStatus(job.provider, job.id);
  const next = writeJob(slug, {
    ...job,
    status: live.status,
    videoUrl: live.videoUrl || job.videoUrl || '',
    thumbnailUrl: live.thumbnailUrl || job.thumbnailUrl || '',
    duration: live.duration || job.duration || 0,
    failure: live.failure || '',
    updatedAt: new Date().toISOString(),
  });

  // When complete, point manifest at studio video URL (remote) for the player.
  if (next.status === 'completed' && next.videoUrl) {
    const lesson = LESSONS[slug];
    if (lesson) {
      const manifestFile = path.join(ROOT, lesson.manifestPath);
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        manifest.studioVideo = next.videoUrl;
        manifest.studioProvider = next.provider;
        manifest.studioJobId = next.id;
        manifest.teacher = lesson.teacherName;
        manifest.teacherTitle = 'معلّمة مساعدة';
        if (next.thumbnailUrl) manifest.poster = next.thumbnailUrl;
        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
      } catch {
        /* preview manifest may be absent in some envs */
      }
    }
  }
  return { job: next, studio: studioProviderStatus() };
}
