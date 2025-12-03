import { Injectable, NotFoundException } from '@nestjs/common';
import { Plan, PlanCode, PlanFeatures } from '@fnd/domain';
import { IPlanRepository, ISubscriptionRepository, IWorkspaceRepository } from '@fnd/database';
import {
  IPlanService,
  FeatureCheckResult,
  ValidationResult,
  AccountUsage,
} from '@fnd/backend';

@Injectable()
export class PlanService implements IPlanService {
  constructor(
    private readonly planRepository: IPlanRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
  ) {}

  async canUseFeature(workspaceId: string, featureName: string): Promise<boolean> {
    const plan = await this.getWorkspacePlan(workspaceId);
    return plan.features.flags[featureName] === true;
  }

  async checkLimit(workspaceId: string, limitName: string): Promise<FeatureCheckResult> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limit = (plan.features.limits as any)[limitName];

    if (limit === undefined) {
      return { allowed: true };
    }

    // For now, just return the limit without checking current usage
    // Specific limit checks are done in validateWorkspaceCreation and validateUserAddition
    return {
      allowed: true,
      limit,
    };
  }

  async getWorkspacePlan(workspaceId: string): Promise<Plan> {
    // Check if workspace has an active subscription
    const subscription = await this.subscriptionRepository.findActiveByWorkspaceId(workspaceId);

    if (subscription) {
      // Get plan from subscription
      // We need to join with plan_prices to get the plan_id
      // For now, we'll get all plans and find the one that matches
      const allPlans = await this.planRepository.findAll();
      const freePlan = allPlans.find(p => p.code === PlanCode.FREE);

      if (!freePlan) {
        throw new NotFoundException('FREE plan not found');
      }

      // TODO: Implement proper join to get plan from subscription
      // For MVP, if there's a subscription, it's a paid plan
      // We need to determine which plan based on plan_price_id
      return freePlan; // Placeholder - needs proper implementation
    }

    // No subscription = FREE plan
    const freePlan = await this.planRepository.findByCode(PlanCode.FREE);
    if (!freePlan) {
      throw new NotFoundException('FREE plan not found');
    }

    return freePlan;
  }

  async getAccountUsage(accountId: string): Promise<AccountUsage> {
    const workspaces = await this.workspaceRepository.findByAccountId(accountId);

    // Calculate total workspace limit across all workspaces
    // Each workspace has its own plan, so we sum the limits
    let totalLimit = 0;

    for (const workspace of workspaces) {
      const plan = await this.getWorkspacePlan(workspace.id);
      totalLimit += plan.features.limits.workspaces;
    }

    return {
      workspacesUsed: workspaces.length,
      workspacesLimit: totalLimit,
    };
  }

  async validateWorkspaceCreation(accountId: string): Promise<ValidationResult> {
    const usage = await this.getAccountUsage(accountId);

    if (usage.workspacesUsed >= usage.workspacesLimit) {
      return {
        allowed: false,
        reason: `Você atingiu o limite de ${usage.workspacesLimit} workspaces. Faça upgrade para criar mais.`,
      };
    }

    return { allowed: true };
  }

  async validateUserAddition(workspaceId: string): Promise<ValidationResult> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limit = plan.features.limits.usersPerWorkspace;

    // TODO: Get current user count in workspace
    // For now, we'll allow it
    // const currentUsers = await this.workspaceUserRepository.countByWorkspaceId(workspaceId);

    // if (currentUsers >= limit) {
    //   return {
    //     allowed: false,
    //     reason: `Este workspace atingiu o limite de ${limit} usuários. Faça upgrade do plano.`,
    //   };
    // }

    return { allowed: true };
  }
}
