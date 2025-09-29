import { Worker } from "bullmq";
import { redisConnection } from "./config/reddis";

const TRANSLATION_QUEUE_NAME = "translations_queue";

console.log("🔶 The OmniverseTV worker has started.");
console.log(
  "Waiting for translation jobs in the " + TRANSLATION_QUEUE_NAME + " queue..."
);

//Create a new woeker instance
const worker = new Worker(TRANSLATION_QUEUE_NAME, async (job) => {
  // This is where the translation logic will eventually go.
  // For now, we simulate the work to confirm the system works.
  console.log("🔵[WORKER] Processing job: " + job.id);
  console.log(`...-Received job data: ${JSON.stringify(job.data)}`);

  //Simulate a time-consuming task, like calling an external translation API
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // In a real implementation, we would save the translation to the database here.
  const mockTranslation =`Content translated for package ${job.data.packageId} and language ${job.data.languageCode}`;
  console.log(`🟢[WORKER] Job completed: #${job.id}`);
  //Mark the job as completed
  return{status: 'completed', result: mockTranslation}},
  //Connection to the Redis server
  {connection: redisConnection}
);

worker.on('failed', (job, err) => {
  console.log(`🔴[WORKER] Worker failed to process job #${job?.id}. Error: ${err.message}`);
  console.log(err);
});
