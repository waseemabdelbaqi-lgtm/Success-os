export const SUCCESS_OS_LESSON_REQUIREMENTS=[
 'recordedLesson','liveLesson','aiTeacher','aiTutor','aiMentor','objectives','learningOutcomes','summary','detailedNotes','illustrations','animations','interactiveDiagrams','virtualLabs','simulations','definitions','equations','rules','examples','solvedExamples','practiceQuestions','homework','interactiveExercises','flashcards','mindMap','keyTakeaways','commonMistakes','faq','lessonChat','downloadableNotes','printableNotes','teacherNotes','parentNotes','accessibility','estimatedStudyTime','difficulty','prerequisites','relatedLessons','relatedSkills','careerConnections','universityConnections','professionalApplications'
];

export const SUCCESS_OS_AUTOMATIC_FEATURES=[
 'shortSummary','visualSummary','revisionSheet','formulaSheet','vocabulary','studyPlan','additionalPractice','adaptivePractice','weaknessDetection','personalizedRevision','recommendations','examPreparation','questionGenerator','explanationGenerator','hintGenerator','translation','speechNarration','readingMode','simplifiedMode','advancedMode'
];

export const SUCCESS_OS_LESSON_ASSESSMENTS=['quickQuiz','practiceQuiz','adaptiveQuiz','timedQuiz','homeworkQuiz','challengeQuiz','revisionQuiz'];
export const SUCCESS_OS_UNIT_ASSESSMENTS=['unitTest','unitRevision','unitSummary','unitFlashcards','unitMindMap','aiReview'];
export const SUCCESS_OS_SUBJECT_ASSESSMENTS=['midtermExam','finalExam','comprehensivePracticeExam','mockExams','adaptiveExams','performanceAnalysis','personalizedFeedback','studyRecommendations','weaknessReport','progressReport','masteryReport'];
export const SUCCESS_OS_VIDEO_REQUIREMENTS=['adaptiveStreaming','resumePosition','chapters','timestamps','bookmarks','transcript','subtitles','multilingualAudio','playbackSpeed','crossDeviceSync','lowBandwidthMode'];

const present=value=>Array.isArray(value)?value.length>0:value&&typeof value==='object'?Object.keys(value).length>0:value!==undefined&&value!==null&&value!=='';
const checkGroup=(source,fields)=>Object.fromEntries(fields.map(field=>[field,present(source?.[field])]));

export function verifyMasterLessonPackage(pkg={}){
 const content=pkg.content||pkg;
 const checks={
  identity:['country','curriculumType','curriculum','gradeOrYear','subject','unit','lesson','language'].every(field=>present(pkg.identity?.[field]||content[field])),
  lesson:checkGroup(content,SUCCESS_OS_LESSON_REQUIREMENTS),
  automatic:checkGroup(content.automaticFeatures||content,SUCCESS_OS_AUTOMATIC_FEATURES),
  assessments:checkGroup(content.assessments||content,SUCCESS_OS_LESSON_ASSESSMENTS),
  video:checkGroup(content.videoFeatures||pkg.videoFeatures||{},SUCCESS_OS_VIDEO_REQUIREMENTS),
  originalContent:pkg.rights?.originalRewriteRequired===true,
  sourceRightsReviewed:pkg.approval?.sourceRights===true,
  scientificReview:pkg.approval?.scientific===true,
  curriculumReview:pkg.approval?.curriculum===true,
  humanAcademicReview:pkg.approval?.humanAcademic===true||pkg.approval?.teacher===true
 };
 const flat=[checks.identity,...Object.values(checks.lesson),...Object.values(checks.automatic),...Object.values(checks.assessments),...Object.values(checks.video),checks.originalContent,checks.sourceRightsReviewed,checks.scientificReview,checks.curriculumReview,checks.humanAcademicReview];
 const missing={lesson:Object.entries(checks.lesson).filter(([,ok])=>!ok).map(([key])=>key),automatic:Object.entries(checks.automatic).filter(([,ok])=>!ok).map(([key])=>key),assessments:Object.entries(checks.assessments).filter(([,ok])=>!ok).map(([key])=>key),video:Object.entries(checks.video).filter(([,ok])=>!ok).map(([key])=>key)};
 return {passed:flat.every(Boolean),score:Math.round(flat.filter(Boolean).length/flat.length*100),checks,missing,publicationAllowed:flat.every(Boolean)};
}

export function verifyMasterSubjectPackage(subject={}){
 const assessmentChecks=checkGroup(subject.assessments||subject,SUCCESS_OS_SUBJECT_ASSESSMENTS);
 const units=Array.isArray(subject.units)?subject.units:[];
 const unitChecks=units.map(unit=>({title:unit.title,checks:checkGroup(unit.assessments||unit,SUCCESS_OS_UNIT_ASSESSMENTS),lessons:(unit.lessons||[]).map(verifyMasterLessonPackage)}));
 const passed=units.length>0&&Object.values(assessmentChecks).every(Boolean)&&unitChecks.every(unit=>Object.values(unit.checks).every(Boolean)&&unit.lessons.length>0&&unit.lessons.every(lesson=>lesson.passed));
 return {passed,publicationAllowed:passed,assessmentChecks,unitChecks};
}

export function masterDirectiveStatus(){return {architecture:'existing architecture is immutable',changePolicy:'enrich-optimize-complete-only',coverage:'all national, international, university and professional curricula',lessonRequirements:SUCCESS_OS_LESSON_REQUIREMENTS.length,automaticFeatures:SUCCESS_OS_AUTOMATIC_FEATURES.length,lessonAssessments:SUCCESS_OS_LESSON_ASSESSMENTS.length,unitAssessments:SUCCESS_OS_UNIT_ASSESSMENTS.length,subjectAssessments:SUCCESS_OS_SUBJECT_ASSESSMENTS.length,videoRequirements:SUCCESS_OS_VIDEO_REQUIREMENTS.length,publicationRule:'100% requirements + source rights + scientific + curriculum + human academic review'};}
