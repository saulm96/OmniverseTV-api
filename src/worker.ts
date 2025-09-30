import { Worker } from "bullmq";
import { redisConnection } from "./config/reddis/reddis";
import { connectToDatabase } from "./config/database/connection";
import { processTranslationJob } from "./jobs/translationProcessor";

const TRANSLATION_QUEUE_NAME = 'translations_queue';

/**
 * Initialize the worker 
 */
const startWorker = async()=>{
  try{
    //Connect to the database
    await connectToDatabase();
    console.log('✅ [WORKER] Connected to the database');

    console.log('🔶 OmniverseTV worker started.');
    console.log(
      `Listening for jobs in queue:  "${TRANSLATION_QUEUE_NAME}"...`
    );

    //Create the worker instance
    new Worker(
      TRANSLATION_QUEUE_NAME,
      async(job) => {
        console.log(`\n🔵 [WORKER] Processing translation job #${job.id}`);
        console.log(`   - Data received: ${JSON.stringify(job.data)}`);

        //Call the separated processor login
        await processTranslationJob(job);

        console.log(`🟢 [WORKER] Job #${job.id} completed successfully.`);
      },{connection: redisConnection}
    );
  } catch(error){
    console.error('🔴 [WORKER] Error al iniciar el worker:', error);
    process.exit(1);
  }
};

startWorker();