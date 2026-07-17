export const lessonProductionPipeline=[
 {id:'ingest',label:'Secure ingestion',task:'rights-and-file-validation',required:true},
 {id:'ocr',label:'OCR & structure extraction',task:'ocr',providers:['mistral-ocr','mathpix','google-document-ai'],required:true},
 {id:'curriculum',label:'Curriculum alignment',task:'reasoning',providers:['openai','gemini'],required:true},
 {id:'lesson',label:'Original lesson writing',task:'lesson-writing',providers:['openai','gemini'],required:true},
 {id:'questions',label:'Assessment generation',task:'question-generation',providers:['openai','gemini'],required:true},
 {id:'visuals',label:'Educational visuals',task:'image',providers:['openai','gemini','flux','ideogram'],required:false},
 {id:'motion',label:'Animation & simulation',task:'animation',providers:['gemini','runway','pika','luma'],required:false},
 {id:'teacher',label:'Human AI teacher',task:'avatar-video',providers:['heygen','synthesia','tavus','colossyan','elai'],required:true},
 {id:'voice',label:'Voice & dubbing',task:'voice',providers:['elevenlabs','cartesia','gemini'],required:false},
 {id:'translation',label:'Translation & subtitles',task:'translation',providers:['openai','gemini','deepl'],required:true},
 {id:'math',label:'Formula validation',task:'math',providers:['sympy','mathpix'],required:false},
 {id:'quality',label:'Scientific and academic QA',task:'quality',providers:['gemini','openai'],required:true},
 {id:'human-review',label:'Expert teacher approval',task:'human-approval',providers:[],required:true},
 {id:'publish',label:'Protected publishing',task:'platform-publish',providers:[],required:true}
];

export const pipelineRules={
 preserveArchitecture:true,copyProtectedSources:false,requireSourceProvenance:true,requireCurriculumIdentity:true,
 requireHumanApproval:true,allowAutomaticFallback:true,storeProviderAudit:true,exposeSecrets:false
};

export const lessonPackageOutputs=['Human-like Recorded Lesson (15–30 min)','AI Teacher Video','Slides','Interactive Whiteboard','Educational Images','Animations','Scientific Simulations','Lesson Summary','Student Notes','Flashcards','Mind Map','Practice Questions','Lesson Quiz','Homework','Unit Exam','Final Exam'];

export const officialBookPipeline=[
 {id:'baseline',label:'Official curriculum baseline',required:true},
 {id:'rights',label:'Source rights and provenance',required:true},
 {id:'cross-check',label:'Multi-source curriculum cross-check',required:true},
 {id:'blueprint',label:'Original Success OS book blueprint',required:true},
 {id:'lessons',label:'Per-lesson content production',required:true},
 {id:'coverage',label:'100% curriculum coverage verification',required:true},
 {id:'academic-review',label:'AI and human academic review',required:true},
 {id:'protected-publish',label:'Protected Student Portal publication',required:true}
];
