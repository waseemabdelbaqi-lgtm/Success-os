/**
 * Photorealism material helpers for Sara & Ali skinned humans.
 * Improves skin/eye/hair response without inventing PBR texture maps that do not exist.
 */
import * as THREE from "three";

export type TeacherSkinId = "sara" | "ali";

export function skinTintFor(teacherId: TeacherSkinId): THREE.Color {
  return new THREE.Color(teacherId === "ali" ? "#e8b896" : "#f0c4a0");
}

export function clothColorFor(teacherId: TeacherSkinId): THREE.Color {
  return new THREE.Color(teacherId === "ali" ? "#1e3a5f" : "#3f5a3a");
}

export function hairColorFor(teacherId: TeacherSkinId): THREE.Color {
  return new THREE.Color(teacherId === "ali" ? "#1a1410" : "#2a1c14");
}

/** Soft-skin MeshPhysicalMaterial — preserves portrait albedo when present. */
export function buildSkinMaterial(
  source: THREE.MeshStandardMaterial,
  teacherId: TeacherSkinId,
  morphTargets: boolean,
): THREE.MeshPhysicalMaterial {
  const tint = skinTintFor(teacherId);
  return new THREE.MeshPhysicalMaterial({
    map: source.map ?? null,
    normalMap: source.normalMap ?? null,
    roughnessMap: source.roughnessMap ?? null,
    aoMap: source.aoMap ?? null,
    color: source.map ? new THREE.Color("#ffffff") : tint.clone(),
    roughness: 0.42,
    metalness: 0.015,
    sheen: 0.45,
    sheenRoughness: 0.48,
    sheenColor: new THREE.Color("#f0c4a8"),
    clearcoat: 0.12,
    clearcoatRoughness: 0.48,
    // Approximate soft subsurface scatter response (Three r152+)
    transmission: 0.04,
    thickness: 0.35,
    attenuationColor: new THREE.Color("#c47a5a"),
    attenuationDistance: 0.55,
    envMapIntensity: 0.95,
    morphTargets,
    morphNormals: morphTargets,
  });
}

export function buildEyeMaterial(
  source: THREE.MeshStandardMaterial,
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: source.map ?? null,
    color: source.color?.clone() ?? new THREE.Color("#e8f0f8"),
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.45,
    ior: 1.4,
  });
}

export function buildHairMaterial(
  source: THREE.MeshStandardMaterial,
  teacherId: TeacherSkinId,
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: source.map ?? null,
    color: source.map ? new THREE.Color("#ffffff") : hairColorFor(teacherId),
    roughness: 0.68,
    metalness: 0.02,
    sheen: 0.55,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color("#6a5040"),
    envMapIntensity: 0.7,
  });
}

/** Classify mesh for material routing. */
export function classifyTeacherMesh(mesh: THREE.Mesh): "face" | "eye" | "hair" | "cloth" {
  const n = (mesh.name || "").toLowerCase();
  if (n.includes("eye") || n.includes("cornea") || n.includes("sclera")) return "eye";
  if (n.includes("hair") || n.includes("lash") || n.includes("brow")) return "hair";
  if (
    n.includes("face") ||
    n.includes("head") ||
    n.includes("skin") ||
    !!mesh.morphTargetDictionary
  ) {
    return "face";
  }
  return "cloth";
}
