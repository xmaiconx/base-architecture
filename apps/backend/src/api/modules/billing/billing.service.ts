import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException, Inject } from '@nestjs/common';
import {
  IAccountRepository,
  IWorkspaceRepository,
  IWorkspaceUserRepository,
  IPlanRepository,
  ISubscriptionRepository,
} from '@fnd/database';
import { IStripeService, IConfigurationService } from '@fnd/backend';
import { UserRole } from '@fnd/domain';
import { PlanService } from './plan.service';
import {
  BillingInfoResponseDto,
  PlanResponseDto,
  CreateCheckoutDto,
  CreatePortalDto,
} from './dtos';

@Injectable()
export class BillingService {
  constructor(
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
    @Inject('IWorkspaceRepository')
    private readonly workspaceRepository: IWorkspaceRepository,
    @Inject('IWorkspaceUserRepository')
    private readonly workspaceUserRepository: IWorkspaceUserRepository,
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject('IStripeService')
    private readonly stripeService: IStripeService,
    private readonly planService: PlanService,
    @Inject('IConfigurationService')
    private readonly configService: IConfigurationService,
  ) {}

  async createCheckoutSession(dto: CreateCheckoutDto, userId: string): Promise<{ checkoutUrl: string; sessionId: string }> {
    // 1. Verify workspace exists
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 2. Verify user is owner of workspace
    const workspaceUser = await this.workspaceUserRepository.findByWorkspaceAndUser(dto.workspaceId, userId);
    if (!workspaceUser || workspaceUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Apenas owners podem alterar o plano');
    }

    // 3. Verify plan exists
    const plan = await this.planRepository.findByCode(dto.planCode);
    if (!plan) {
      throw new BadRequestException('Plano não encontrado');
    }

    // 4. Check if workspace already has this plan
    const currentPlan = await this.planService.getWorkspacePlan(dto.workspaceId);
    if (currentPlan.code === dto.planCode) {
      throw new ConflictException('Workspace já possui este plano');
    }

    // 5. Get or create Stripe customer
    const account = await this.accountRepository.findById(workspace.accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    let customerId = account.stripeCustomerId;

    if (!customerId) {
      // Create Stripe customer
      const user = await this.accountRepository.findById(workspace.accountId); // Get account owner
      if (!user) {
        throw new NotFoundException('Account owner not found');
      }

      customerId = await this.stripeService.createCustomer(
        user.name, // Using account name as customer name
        user.name,
      );

      // Save customer ID to account
      await this.accountRepository.update(workspace.accountId, { stripeCustomerId: customerId });
    }

    // 6. Get price for plan
    // TODO: Get current price from plan_prices table
    // For now, hardcoded priceId (needs to be configured from Stripe)
    const priceId = 'price_xxx'; // Placeholder

    // 7. Create checkout session
    const session = await this.stripeService.createCheckoutSession({
      customerId,
      priceId,
      workspaceId: dto.workspaceId,
      successUrl: this.configService.getStripeSuccessUrl(),
      cancelUrl: this.configService.getStripeCancelUrl(),
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async createPortalSession(dto: CreatePortalDto, userId: string): Promise<{ portalUrl: string }> {
    // 1. Verify workspace exists
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 2. Verify user is owner of workspace
    const workspaceUser = await this.workspaceUserRepository.findByWorkspaceAndUser(dto.workspaceId, userId);
    if (!workspaceUser || workspaceUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Apenas owners podem gerenciar billing');
    }

    // 3. Get account
    const account = await this.accountRepository.findById(workspace.accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // 4. Verify account has Stripe customer
    if (!account.stripeCustomerId) {
      throw new BadRequestException('Você ainda não possui assinaturas ativas');
    }

    // 5. Create portal session
    const frontendUrl = this.configService.getFrontendUrl();
    const returnUrl = `${frontendUrl}/settings/billing`;

    const session = await this.stripeService.createPortalSession(account.stripeCustomerId, returnUrl);

    return {
      portalUrl: session.url,
    };
  }

  async getWorkspaceBillingInfo(workspaceId: string, userId: string): Promise<BillingInfoResponseDto> {
    // 1. Verify workspace exists
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 2. Verify user has access to workspace
    const workspaceUser = await this.workspaceUserRepository.findByWorkspaceAndUser(workspaceId, userId);
    if (!workspaceUser) {
      throw new ForbiddenException('Você não tem acesso a este workspace');
    }

    // 3. Get plan
    const plan = await this.planService.getWorkspacePlan(workspaceId);

    // 4. Get subscription (if any)
    const subscription = await this.subscriptionRepository.findActiveByWorkspaceId(workspaceId);

    // 5. Get usage
    const accountUsage = await this.planService.getAccountUsage(workspace.accountId);

    // 6. Count users in workspace
    // TODO: Implement workspaceUserRepository.countByWorkspaceId
    const usersInWorkspace = 1; // Placeholder

    return {
      plan: {
        code: plan.code,
        name: plan.name,
        features: plan.features,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || '',
            cancelAtPeriodEnd: !!subscription.canceledAt,
          }
        : null,
      usage: {
        workspacesUsed: accountUsage.workspacesUsed,
        workspacesLimit: accountUsage.workspacesLimit,
        usersInWorkspace,
        usersLimit: plan.features.limits.usersPerWorkspace,
      },
    };
  }

  async getAvailablePlans(): Promise<PlanResponseDto[]> {
    const plans = await this.planRepository.findActive();

    // TODO: Join with plan_prices to get current price
    return plans.map(plan => ({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      price: null, // Placeholder - needs proper join
      features: plan.features,
    }));
  }
}
