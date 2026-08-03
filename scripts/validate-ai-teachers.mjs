#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const assert = (c, m) => {
  if (!c) failures.push(m);
};

const doctrinePath = path.join(root, "docs/cursor/platform-teachers-doctrine.md");
assert(fs.existsSync(doctrinePath), "Missing platform-teachers-doctrine.md");
const doctrine = fs.readFileSync(doctrinePath, "utf8");
assert(doctrine.includes("سارة") && doctrine.includes("علي"), "Doctrine must name Sara/Ali in Arabic");
assert(doctrine.includes("Dual acceptance"), "Doctrine must include dual acceptance");
assert(
  doctrine.includes("دون الحاجة لإنشاء معلم جديد") || doctrine.includes("without creating a new teacher"),
  "Doctrine must forbid new teachers for subjects",
);

const doctrineTs = path.join(root, "types/platform-teachers.ts");
assert(fs.existsSync(doctrineTs), "Missing types/platform-teachers.ts");
const doctrineSrc = fs.readFileSync(doctrineTs, "utf8");
assert(doctrineSrc.includes('PLATFORM_TEACHER_IDS'), "Missing PLATFORM_TEACHER_IDS");
assert(doctrineSrc.includes("ownerLiveDemoRequired"), "Missing dual-acceptance policy in types");

const catalogPath = path.join(root, "content/media/ai-teachers/catalog.json");
assert(fs.existsSync(catalogPath), "Missing catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
assert(catalog.schema === "success-os.ai-teachers.v1", "Bad schema");
assert(catalog.teachers.length === 2, "Must have exactly 2 teachers (Sara + Ali)");
assert(catalog.role === "platform_official_primary", "Catalog role must be platform_official_primary");

const ids = catalog.teachers.map((t) => t.id).sort();
assert(ids.join(",") === "ali,sara", `Expected ali,sara got ${ids}`);
for (const t of catalog.teachers) {
  assert(t.role === "platform_official_primary", `Teacher ${t.id} missing platform role`);
}

for (const tid of ["sara", "ali"]) {
  const base = path.join(root, "content/media/ai-teachers", tid);
  assert(fs.existsSync(path.join(base, "portrait.png")), `Missing portrait ${tid}`);
  for (const pose of ["talk.png", "point.png", "write.png", "idle.png"]) {
    assert(fs.existsSync(path.join(base, "poses", pose)), `Missing pose ${tid}/${pose}`);
  }
  for (const f of ["mouth-closed.png", "mouth-open.png", "mouth-wide.png", "gesture.png"]) {
    assert(fs.existsSync(path.join(base, "flagship", f)), `Missing flagship ${tid}/${f}`);
  }
  assert(fs.existsSync(path.join(base, "alive", "blink.png")), `Missing alive blink ${tid}`);
  assert(fs.existsSync(path.join(base, "alive", "listen.png")), `Missing alive listen ${tid}`);
  assert(fs.existsSync(path.join(root, "public/media/ai-teachers", tid, "portrait.png")), `Missing public ${tid}`);
  for (const clip of ["welcome", "one", "two", "three", "practice", "bye", "intro"]) {
    const mp3 = path.join(base, "audio", `${clip}.mp3`);
    assert(fs.existsSync(mp3) && fs.statSync(mp3).size > 5000, `Missing/small audio ${tid}/${clip}.mp3`);
    assert(
      fs.existsSync(path.join(root, "public/media/ai-teachers", tid, "audio", `${clip}.mp3`)),
      `Missing public audio ${tid}/${clip}`,
    );
  }
  for (const pose of ["stand.png", "point.png", "write.png"]) {
    assert(
      fs.existsSync(path.join(base, "classroom", pose)),
      `Missing classroom pose ${tid}/${pose}`,
    );
    assert(
      fs.existsSync(path.join(root, "public/media/ai-teachers", tid, "classroom", pose)),
      `Missing public classroom pose ${tid}/${pose}`,
    );
  }
}

for (const legacy of ["omar", "layla", "waseem"]) {
  assert(!fs.existsSync(path.join(root, "content/media/ai-teachers", legacy)), `Legacy teacher still present: ${legacy}`);
}

const ts = fs.readFileSync(path.join(root, "lib/ai-teachers/catalog.ts"), "utf8");
assert(ts.includes('id: "sara"') && ts.includes('id: "ali"'), "catalog.ts missing sara/ali");
assert(!ts.includes('id: "omar"') && !ts.includes('id: "layla"'), "catalog.ts still has legacy teachers");
assert(fs.existsSync(path.join(root, "app/ai-teacher/page.tsx")), "Missing platform teacher page /ai-teacher");
assert(fs.existsSync(path.join(root, "components/ai-teachers/platform-teacher-studio.tsx")), "Missing platform teacher studio");
assert(fs.existsSync(path.join(root, "lib/human-engine/universal-lesson-bridge.ts")), "Missing universal lesson bridge");
assert(fs.existsSync(path.join(root, "app/ai-teacher/classroom/page.tsx")), "Missing interactive classroom page");
assert(fs.existsSync(path.join(root, "lib/ai-teachers/master-coach.ts")), "Missing master-coach layer");
assert(fs.existsSync(path.join(root, "components/ai-teachers/interactive-classroom.tsx")), "Missing classroom UI");
assert(fs.existsSync(path.join(root, "components/ai-teachers/living-board.tsx")), "Missing living board");
assert(fs.existsSync(path.join(root, "lib/digital-human-studio/index.ts")), "Missing digital-human-studio engine");
assert(fs.existsSync(path.join(root, "lib/human-engine/index.ts")), "Missing human-engine");
assert(fs.existsSync(path.join(root, "lib/human-engine/semantic-sentence.ts")), "Missing semantic-sentence director");
assert(fs.existsSync(path.join(root, "app/ai-teacher/human-engine-preview/page.tsx")), "Missing human-engine preview page");
assert(fs.existsSync(path.join(root, "app/ai-teacher/live/page.tsx")), "Missing human-engine live studio page");
assert(fs.existsSync(path.join(root, "app/ai-teacher/proof/page.tsx")), "Missing human-engine proof page");
assert(fs.existsSync(path.join(root, "lib/human-engine/teacher-persona.ts")), "Missing teacher personas");
assert(fs.existsSync(path.join(root, "lib/human-engine/proof-lessons.ts")), "Missing proof lessons");
assert(fs.existsSync(path.join(root, "public/media/ai-teachers/sara/humanoid/teacher.glb")), "Missing Sara humanoid GLB");
assert(fs.existsSync(path.join(root, "public/media/ai-teachers/ali/humanoid/teacher.glb")), "Missing Ali humanoid GLB");
assert(fs.existsSync(path.join(root, "components/ai-teachers/skinned-digital-human.tsx")), "Missing skinned digital human");
assert(fs.existsSync(path.join(root, "app/ai-teacher/studio/page.tsx")), "Missing digital human studio page");
const lesson = fs.readFileSync(path.join(root, "lib/ai-teachers/g1-count-lesson.ts"), "utf8");
assert(lesson.includes("check:"), "Lesson must include micro-checks");
assert(lesson.includes("challenge"), "Lesson commands must include challenge");
const classroom = fs.readFileSync(
  path.join(root, "components/ai-teachers/interactive-classroom.tsx"),
  "utf8",
);
assert(classroom.includes("/audio/"), "Classroom must play baked neural audio");

if (failures.length) {
  console.error("validate-ai-teachers FAILED:");
  failures.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log("validate-ai-teachers OK — Sara + Ali official platform teachers (doctrine locked)");
