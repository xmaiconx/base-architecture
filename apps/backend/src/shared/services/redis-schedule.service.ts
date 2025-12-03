import { Injectable, Inject } from '@nestjs/common';
import { IScheduleService, ScheduleConfig, IConfigurationService } from '@fnd/backend';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class RedisScheduleService implements IScheduleService {
  private readonly redis: Redis;
  private readonly scheduledQueue: Queue;
  private readonly scheduledJobs: Map<string, any> = new Map();

  constructor(@Inject('IConfigurationService') private readonly configurationService: IConfigurationService) {
    const redisUrl = this.configurationService.getRedisJobsUrl();
    this.redis = new Redis(redisUrl);

    this.scheduledQueue = new Queue('scheduled-jobs', {
      connection: this.redis,
    });
  }

  async scheduleJob(name: string, schedule: ScheduleConfig, handler: () => Promise<void>): Promise<void> {
    if (this.scheduledJobs.has(name)) {
      await this.cancelJob(name);
    }

    const cronExpression = schedule.toCronExpression();
    const job = await this.scheduledQueue.add(
      name,
      { handler: handler.toString() },
      {
        repeat: {
          pattern: cronExpression,
        },
      }
    );

    this.scheduledJobs.set(name, {
      job,
      handler,
      cronExpression,
    });
  }

  async cancelJob(name: string): Promise<void> {
    const scheduledJob = this.scheduledJobs.get(name);
    if (scheduledJob) {
      await this.scheduledQueue.removeRepeatable(name, {
        pattern: scheduledJob.cronExpression,
      });
      this.scheduledJobs.delete(name);
    }
  }

  async close(): Promise<void> {
    await this.scheduledQueue.close();
    await this.redis.disconnect();
  }
}