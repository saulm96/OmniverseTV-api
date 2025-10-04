import {Worker, Job} from "bullmq";
import {redisConnection} from "./config/reddis/reddis";
import {connectToDatabase} from "./config/database/connection";
import {processorSubscriptionExpiration} from "./jobs/subscriptionProcessor";
import {SUBSCRIPTION_QUEUE_NAME} from "./queues/subscriptionQueue";

const startScheduler = async () => {
    try {
      // Connect to the database
      await connectToDatabase();
      console.log('✅ [SCHEDULER] Connected to the database.');
  
      // Redis connection will be tested when the Worker connects
      console.log('🔶 [SCHEDULER] Redis config:', redisConnection);
  
      console.log('🔶 OmniverseTV Scheduler started.');
      console.log(
        `🔶 [SCHEDULER] Listening for subscription jobs in queue: "${SUBSCRIPTION_QUEUE_NAME}"...`
      );
  
      // Create the worker and store the reference
      const worker = new Worker(
        SUBSCRIPTION_QUEUE_NAME,
        async (job: Job) => {
          console.log(`🔵 [WORKER] Received job: ${job.name} (ID: ${job.id})`);
          try {
            await processorSubscriptionExpiration(job);
            console.log(`✅ [WORKER] Job ${job.id} completed successfully`);
          } catch (error) {
            console.error(`❌ [WORKER] Error processing job ${job.id}:`, error);
            throw error; // Re-throw to mark job as failed
          }
        },
        { 
          connection: redisConnection,
          autorun: true, // Ensure the worker starts automatically
        }
      );

      // Worker event listeners for debugging
      worker.on('ready', () => {
        console.log('✅ [WORKER] Worker is ready and waiting for jobs');
      });

      worker.on('active', (job: Job) => {
        console.log(`🔄 [WORKER] Job ${job.id} is now active`);
      });

      worker.on('completed', (job: Job) => {
        console.log(`✅ [WORKER] Job ${job.id} has been completed`);
      });

      worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`❌ [WORKER] Job ${job?.id} failed with error:`, err.message);
      });

      worker.on('error', (err: Error) => {
        console.error('❌ [WORKER] Worker error:', err);
      });

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('🔶 [SCHEDULER] SIGTERM received, closing worker...');
        await worker.close();
        process.exit(0);
      });

      process.on('SIGINT', async () => {
        console.log('🔶 [SCHEDULER] SIGINT received, closing worker...');
        await worker.close();
        process.exit(0);
      });

    } catch (error) {
      console.error('🔴 [SCHEDULER] Failed to start scheduler:', error);
      process.exit(1);
    }
  };
  
startScheduler();