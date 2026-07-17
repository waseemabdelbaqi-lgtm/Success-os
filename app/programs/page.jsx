import { InnerNav } from '../components';

const programs=[
  ['⚛','AP Physics','مسارات تفاعلية للفيزياء مع تشخيص وإتقان وأسئلة موجهة.',['AP Physics 1','AP Physics C']],
  ['◈','AP Chemistry','تعلم مبني على المفاهيم والتجارب وتحليل الأخطاء.',['AP Chemistry','Labs']],
  ['Σ','EST & ACT','تحضير متخصص لامتحانات المواد الدولية في مصر والمنطقة.',['EST II','ACT Subject Tests']],
  ['∿','IGCSE','مسارات Cambridge وEdexcel للفيزياء والكيمياء.',['O Level','IGCSE']],
  ['∆','A Level','تعلم عميق وموجه لطلاب AS وA2 مع تتبع المهارات.',['AS Physics','A2 Chemistry']],
  ['✦','المراجعات الذكية','خطة قصيرة حسب أخطائك ونقاط ضعفك قبل الامتحان.',['AI Diagnostic','Mastery Plan']]
];
export default function ProgramsPage(){return <div className="os-page"><InnerNav active="programs"/><main className="os-page-content"><header className="os-page-head"><span className="tag">المسارات الأكاديمية</span><h1>اختر منهاجك. والنظام يبني طريقك.</h1><p>كل طالب يبدأ من مستواه الحقيقي، وليس من أول صفحة في الكتاب. التشخيص يحدد الفجوات ثم ينشئ خطة تعلم قابلة للتعديل.</p></header><div className="programs-grid">{programs.map(([icon,title,desc,tags])=><article className="os-card program-card" key={title}><span className="program-icon">{icon}</span><h3>{title}</h3><p>{desc}</p><div className="program-tags">{tags.map(t=><span key={t}>{t}</span>)}</div><a href="/onboarding">ابدأ المسار ←</a></article>)}</div></main></div>}

