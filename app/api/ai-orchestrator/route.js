import {providerStatus} from '../../lib/ai/provider-registry';
import {lessonPackageOutputs,lessonProductionPipeline,pipelineRules} from '../../lib/ai/production-pipeline';
import {orchestratorHealth} from '../../lib/ai/orchestrator';

export async function GET(){
 const providers=providerStatus();
 return Response.json({architecture:'SUCCESS OS Modular AI Orchestrator',policy:{hardCodedProvider:false,automaticFallback:true,keysExposed:false,humanReviewRequired:true,scientificQualityGate:true,...pipelineRules},configured:providers.filter(x=>x.configured).map(x=>x.id),operational:providers.filter(x=>x.operational).map(x=>x.id),health:orchestratorHealth(),pipeline:lessonProductionPipeline,outputs:lessonPackageOutputs,providers});
}
