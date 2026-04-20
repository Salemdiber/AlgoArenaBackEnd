import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

type CheckoutSessionLike = {
  id: string;
  metadata?: Record<string, string | undefined> | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string;
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe.Stripe | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly users: UserService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  createHintCheckoutSession = async (userId: string) => {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');

    const user = await this.users.findOne(userId).catch(() => null) as any;
    if (!user) throw new NotFoundException('User not found');

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${frontendUrl}/speed-challenge?hint_purchase=success`,
      cancel_url: `${frontendUrl}/speed-challenge?hint_purchase=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 199,
            product_data: {
              name: 'AlgoArena Hint Credit',
              description: 'Unlock one additional hint credit',
            },
          },
        },
      ],
      metadata: {
        userId,
        credits: '1',
      },
    });

    return { url: session.url };
  };

  fulfillStripeSession = async (session: CheckoutSessionLike) => {
    const userId = String(session.metadata?.userId || '');
    if (!userId) return;
    const credits = Number(session.metadata?.credits || 1);
    await this.users.addHintCredits(userId, credits, {
      stripeSessionId: session.id,
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      status: session.payment_status === 'paid' ? 'paid' : 'pending',
    });
  };
}