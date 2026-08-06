#!/usr/bin/env node
/**
 * Build Sara & Ali as real skinned GLB humanoids:
 * - Mixamo full skeleton (hips→fingers→eyes) from Xbot base
 * - Distinct clothing materials per teacher
 * - Head morph-target mesh (ARKit-named) for lip sync / expression
 * - Face albedo from each teacher's photoreal portrait
 *
 * Output:
 *   public/media/ai-teachers/{sara|ali}/humanoid/teacher.glb
 *   content/media/ai-teachers/{sara|ali}/humanoid/teacher.glb (mirror)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO, Document } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup } from "@gltf-transform/functions";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceGlb = path.join(root, "public/media/ai-teachers/_source/Xbot.glb");

const TEACHERS = [
  {
    id: "sara",
    clothing: [0.32, 0.42, 0.28, 1], // olive blazer
    accent: [0.85, 0.78, 0.62, 1],
    skin: [0.76, 0.58, 0.48, 1],
    hair: [0.12, 0.09, 0.07, 1],
    scale: [0.98, 0.97, 0.98],
    portrait: "public/media/ai-teachers/sara/portrait.png",
  },
  {
    id: "ali",
    clothing: [0.14, 0.22, 0.38, 1], // navy blazer
    accent: [0.55, 0.6, 0.7, 1],
    skin: [0.7, 0.52, 0.4, 1],
    hair: [0.08, 0.07, 0.06, 1],
    scale: [1.02, 1.03, 1.02],
    portrait: "public/media/ai-teachers/ali/portrait.png",
  },
];

const MORPHS = [
  "jawOpen",
  "mouthClose",
  "mouthFunnel",
  "mouthPucker",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
  "cheekSquintLeft",
  "cheekSquintRight",
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function makeHeadMorphPrimitive(doc, basePositions, morphName) {
  const n = basePositions.length / 3;
  const deltas = new Float32Array(basePositions.length);
  for (let i = 0; i < n; i++) {
    const x = basePositions[i * 3];
    const y = basePositions[i * 3 + 1];
    const z = basePositions[i * 3 + 2];
    let dx = 0;
    let dy = 0;
    let dz = 0;
    // Lower face verts (mouth region): y < 0.02 on unit head centered
    const mouth = y < 0.02 && Math.abs(x) < 0.08;
    const left = x < 0;
    const eyeL = y > 0.05 && y < 0.12 && x < -0.02 && x > -0.08;
    const eyeR = y > 0.05 && y < 0.12 && x > 0.02 && x < 0.08;
    const brow = y > 0.1 && y < 0.16;

    switch (morphName) {
      case "jawOpen":
        if (mouth) {
          dy = -0.045;
          dz = 0.02;
        }
        break;
      case "mouthClose":
        if (mouth) dy = 0.01;
        break;
      case "mouthFunnel":
        if (mouth) {
          dx = x * -0.35;
          dz = 0.03;
        }
        break;
      case "mouthPucker":
        if (mouth) {
          dx = x * -0.5;
          dz = 0.04;
        }
        break;
      case "mouthSmileLeft":
        if (mouth && left) {
          dy = 0.02;
          dx = -0.015;
        }
        break;
      case "mouthSmileRight":
        if (mouth && !left) {
          dy = 0.02;
          dx = 0.015;
        }
        break;
      case "mouthFrownLeft":
        if (mouth && left) dy = -0.015;
        break;
      case "mouthFrownRight":
        if (mouth && !left) dy = -0.015;
        break;
      case "eyeBlinkLeft":
        if (eyeL) dy = -0.018;
        break;
      case "eyeBlinkRight":
        if (eyeR) dy = -0.018;
        break;
      case "browInnerUp":
        if (brow && Math.abs(x) < 0.04) dy = 0.012;
        break;
      case "browDownLeft":
        if (brow && left) dy = -0.01;
        break;
      case "browDownRight":
        if (brow && !left) dy = -0.01;
        break;
      case "cheekSquintLeft":
        if (left && y > 0 && y < 0.08) dy = 0.008;
        break;
      case "cheekSquintRight":
        if (!left && y > 0 && y < 0.08) dy = 0.008;
        break;
      default:
        break;
    }
    deltas[i * 3] = dx;
    deltas[i * 3 + 1] = dy;
    deltas[i * 3 + 2] = dz;
  }
  const acc = doc
    .createAccessor(`${morphName}_POS`)
    .setType("VEC3")
    .setArray(deltas);
  return doc.createPrimitiveTarget(morphName).setAttribute("POSITION", acc);
}

function buildHeadMesh(doc, teacher) {
  // Icosphere-ish head: generate UV sphere
  const radius = 0.105;
  const segW = 24;
  const segH = 16;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= segH; y++) {
    const v = y / segH;
    const phi = v * Math.PI;
    for (let x = 0; x <= segW; x++) {
      const u = x / segW;
      const theta = u * Math.PI * 2;
      const px = -radius * Math.cos(theta) * Math.sin(phi);
      const py = radius * Math.cos(phi);
      const pz = radius * Math.sin(theta) * Math.sin(phi);
      positions.push(px, py, pz);
      const len = Math.hypot(px, py, pz) || 1;
      normals.push(px / len, py / len, pz / len);
      uvs.push(u, 1 - v);
    }
  }
  for (let y = 0; y < segH; y++) {
    for (let x = 0; x < segW; x++) {
      const a = y * (segW + 1) + x;
      const b = a + segW + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const posArr = new Float32Array(positions);
  const posAcc = doc
    .createAccessor("headPos")
    .setType("VEC3")
    .setArray(posArr);
  const nrmAcc = doc
    .createAccessor("headNrm")
    .setType("VEC3")
    .setArray(new Float32Array(normals));
  const uvAcc = doc
    .createAccessor("headUv")
    .setType("VEC2")
    .setArray(new Float32Array(uvs));
  const idxAcc = doc
    .createAccessor("headIdx")
    .setType("SCALAR")
    .setArray(new Uint16Array(indices));

  const mat = doc
    .createMaterial("TeacherHead")
    .setBaseColorFactor(teacher.skin)
    .setRoughnessFactor(0.55)
    .setMetallicFactor(0.05);

  // Bind photoreal portrait as face albedo when available
  const portraitPath = path.join(root, teacher.portrait);
  if (fs.existsSync(portraitPath)) {
    const bytes = new Uint8Array(fs.readFileSync(portraitPath));
    const texture = doc
      .createTexture(`${teacher.id}_face`)
      .setMimeType("image/png")
      .setImage(bytes);
    mat.setBaseColorTexture(texture);
    console.log(`  face texture ${teacher.id}: ${bytes.byteLength} bytes`);
  } else {
    console.warn(`  missing portrait: ${portraitPath}`);
  }

  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", posAcc)
    .setAttribute("NORMAL", nrmAcc)
    .setAttribute("TEXCOORD_0", uvAcc)
    .setIndices(idxAcc)
    .setMaterial(mat);

  for (const name of MORPHS) {
    prim.addTarget(makeHeadMorphPrimitive(doc, posArr, name));
  }

  const mesh = doc.createMesh("TeacherFace").addPrimitive(prim);
  // Three.js GLTFLoader reads extras.targetNames into morphTargetDictionary
  mesh.setExtras({ targetNames: MORPHS, morphTargetNames: MORPHS });
  return mesh;
}

function recolorMaterials(doc, teacher) {
  for (const mat of doc.getRoot().listMaterials()) {
    const name = (mat.getName() || "").toLowerCase();
    const color = mat.getBaseColorFactor() || [1, 1, 1, 1];
    // Heuristic: darker cloth-ish materials get teacher clothing color
    const luminance = 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
    if (name.includes("hair") || luminance < 0.18) {
      mat.setBaseColorFactor(teacher.hair);
    } else if (luminance > 0.55 && luminance < 0.9) {
      mat.setBaseColorFactor(teacher.skin);
    } else {
      mat.setBaseColorFactor(teacher.clothing);
      mat.setRoughnessFactor(0.65);
      mat.setMetallicFactor(0.08);
    }
  }
}

function findNode(doc, pred) {
  return doc.getRoot().listNodes().find(pred) || null;
}

async function buildOne(teacher) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(sourceGlb);

  // Root scale for body proportions
  const hips =
    findNode(doc, (n) => (n.getName() || "").includes("Hips")) ||
    doc.getRoot().listNodes()[0];
  if (hips) {
    const s = teacher.scale;
    hips.setScale([s[0], s[1], s[2]]);
  }

  recolorMaterials(doc, teacher);

  // Attach morphable face to Head bone
  const headNode = findNode(doc, (n) => (n.getName() || "").endsWith("Head"));
  const faceMesh = buildHeadMesh(doc, teacher);
  const faceNode = doc
    .createNode("HE_TeacherFace")
    .setMesh(faceMesh)
    .setTranslation([0, 0.06, 0.09])
    .setScale([1.05, 1.1, 1.05]);
  if (headNode) headNode.addChild(faceNode);
  else doc.getRoot().getDefaultScene()?.addChild(faceNode);

  // Tag document
  doc
    .getRoot()
    .setExtras({
      successOsTeacherId: teacher.id,
      humanEngine: "success-os.humanoid.v1",
      morphTargetNames: MORPHS,
      skeleton: "mixamo",
    });

  // Keep newly added face textures — prune unused only
  await doc.transform(dedup());

  const outPublic = path.join(
    root,
    `public/media/ai-teachers/${teacher.id}/humanoid`,
  );
  const outContent = path.join(
    root,
    `content/media/ai-teachers/${teacher.id}/humanoid`,
  );
  ensureDir(outPublic);
  ensureDir(outContent);
  const outFile = path.join(outPublic, "teacher.glb");
  await io.write(outFile, doc);
  fs.copyFileSync(outFile, path.join(outContent, "teacher.glb"));

  const meta = {
    id: teacher.id,
    schema: "success-os.teacher-humanoid.v1",
    glb: `/media/ai-teachers/${teacher.id}/humanoid/teacher.glb`,
    skeleton: "mixamo",
    morphTargets: MORPHS,
    hasFullBody: true,
    hasFingers: true,
    hasEyeBones: true,
    drivenBy: "human-engine",
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outPublic, "meta.json"), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(outContent, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`built ${teacher.id}: ${outFile} (${fs.statSync(outFile).size} bytes)`);
}

async function main() {
  if (!fs.existsSync(sourceGlb)) {
    throw new Error(
      `Missing source skeleton GLB: ${sourceGlb}\nRun: npm run ai-teachers:humanoids:fetch-base`,
    );
  }
  for (const t of TEACHERS) {
    await buildOne(t);
  }
  console.log("teacher humanoids OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
