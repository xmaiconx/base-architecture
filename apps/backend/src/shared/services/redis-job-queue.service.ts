import { Injectable, Inject } from '@nestjs/common';
import { IJobQueue, JobOptions, IConfigurationService } from '@fnd/backend';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class RedisJobQueueService implements IJobQueue {
  private readonly redis: Redis;
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();

  constructor(@Inject('IConfigurationService') private readonly configurationService: IConfigurationService) {
    const redisUrl = this.configurationService.getRedisJobsUrl();
    this.redis = new Redis(redisUrl);
  }

  async add(jobName: string, data: any, options?: JobOptions): Promise<void> {
    let queue = this.queues.get(jobName);

    if (!queue) {
      queue = new Queue(jobName, {
        connection: this.redis,
      });
      this.queues.set(jobName, queue);
    }

    await queue.add(jobName, data, {
      delay: options?.delay,
      attempts: options?.attempts || 3,
      backoff: options?.backoff ? {
        type: options.backoff.type,
        delay: options.backoff.delay,
      } : {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async process(jobName: string, handler: (data: any) => Promise<void>): Promise<void> {
    if (this.workers.has(jobName)) {
      return;
    }

    const worker = new Worker(jobName, async (job: Job) => {
      await handler(job.data);
    }, {
      connection: this.redis,
      concurrency: 5,
    });

    this.workers.set(jobName, worker);
  }

  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    for (const worker of this.workers.values()) {
      await worker.close();
    }

    await this.redis.disconnect();
  }
}