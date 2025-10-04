import { Job } from "bullmq";
import { Subscription } from "../models/Subscription";

interface SubscriptionJobData {
  subscriptionId: number;
}

export const processorSubscriptionExpiration = async (
  job: Job<SubscriptionJobData>
) => {
  const { subscriptionId } = job.data;

  console.log(
    `--------> [PROCESSOR] Processing expiration for subscription #${subscriptionId}`
  );
  console.log(`--------> [PROCESSOR] Job ID: ${job.id}, Job Name: ${job.name}`);
  try {
    const subscription = await Subscription.findByPk(subscriptionId);

    if (!subscription) {
      console.warn(
        `          ⚠️  [PROCESSOR] Subscription #${subscriptionId} not found. Nothing to expire`
      );
      return;
    }
    console.log(
      `          📋 [PROCESSOR] Current subscription status: ${subscription.status}`
    );

    if (subscription.status === "active") {
      subscription.status = "expired";
      await subscription.save();
      console.log(
        `          ✅ [PROCESSOR] Subscription #${subscriptionId} expired successfully`
      );
    } else {
      console.log(
        `          ℹ️  [PROCESSOR] Subscription #${subscriptionId} is ${subscription.status}. Nothing to expire`
      );
    }
  } catch (error) {
    console.error(
      `🔴 [PROCESSOR] Failed to process expiration for subscription #${subscriptionId}. Reason: ${error}`
    );
    throw error;
  }
};
