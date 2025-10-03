import { Worker, Job } from 'bullmq';
import { redisConnection } from './config/reddis/reddis';
import { connectToDatabase } from './config/database/connection';
import { processTranslationJob } from './jobs/translationProcessor';

const TRANSLATION_QUEUE_NAME = 'translations_queue'; 

/**
 * Initialize and start the worker.
 */
const startWorker = async () => {
  try {
    await connectToDatabase();
    console.log('✅ [WORKER] Connected to the database.');

    console.log('🔶 OmniverseTV worker started.');
    console.log(
      `Listening for jobs in queue: "${TRANSLATION_QUEUE_NAME}"...`
    );

    // 2. Create the worker instance.
    const worker = new Worker(
      TRANSLATION_QUEUE_NAME,
      async (job) => {
        // The main logic is delegated to the processor.
        await processTranslationJob(job);
      },
      { connection: redisConnection }
    );

    // --- Listeners for better logging ---
    worker.on('active', (job: Job) => {
      console.log(`\n🔵 [WORKER] Processing job #${job.id} (Attempt #${job.attemptsMade + 1})`);
      console.log(`   - Data received: ${JSON.stringify(job.data)}`);
    });

    worker.on('completed', (job: Job) => {
      console.log(`🟢 [WORKER] Job #${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      if(job){
        console.error(
          `🔴 [WORKER] Job #${job.id} failed after ${job.attemptsMade} attempts with error: ${err.message}`
        );
      }
    });

  } catch (error) {
    console.error('🔴 [WORKER] Error starting worker:', error); 
    process.exit(1);
  }
};

startWorker();

