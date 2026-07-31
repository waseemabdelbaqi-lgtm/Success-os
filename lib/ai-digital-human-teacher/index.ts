/**
 * AI Digital Human Teacher (ADHT) — public API.
 */
export {
  TEACHER_PRESENCE_CAPABILITIES,
  LIVE_TEACHING_ACTIONS,
  getDigitalHumanPresenceContract,
} from "./presence";
export {
  DEFAULT_PROVIDER_BINDINGS,
  listProviderBindings,
  invokeProviderPort,
} from "./providers";
export { STAGE_TEACHING_DEFAULTS, getStageDefaults } from "./stages";
export {
  exampleTeacherProfiles,
  listTeacherProfiles,
  getTeacherProfile,
  upsertTeacherProfile,
  assignTeacherForContext,
  resetTeacherProfilesForTests,
} from "./profiles";
export { getPersonalityMemory, updatePersonalityMemory } from "./personality";
export {
  planDigitalTeacherSession,
  getAiDigitalHumanTeacherSnapshot,
  runAiDigitalHumanTeacherDemo,
} from "./session";

export function aiDigitalHumanTeacherStatus() {
  return {
    schema: "success-os.ai-digital-human-teacher.v1",
    role: "digital_human_teacher_architecture",
    notAChatbot: true,
    centerOfPlatform: true,
    providerAgnostic: true,
    localizedTeachers: true,
    ageAppropriateTeachers: true,
    personalityMemory: true,
    multimodalReady: true,
    liveProvidersEnabled: false,
    shipsLiveAvatarVideo: false,
    shipsLiveTtsStt: false,
    groundedByAte: true,
    ileSoleRuntime: true,
    adr: ["ADR-0049", "ADR-0055", "ADR-0055.1"],
    parentPr: "#55 AI Teacher Engine",
  };
}
