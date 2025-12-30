import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
});

export async function POST(req: any) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET_KEY || process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error("Webhook Signature Verification Failed:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
            const supabase = createServiceClient();
            const creditsToAdd = plan === 'Studio' ? 150000 : plan === 'Pro' ? 50000 : 10000;

            // 1. Get user and their referrer
            const { data: user } = await supabase
                .from('users')
                .select('credits, referred_by')
                .eq('clerk_id', userId)
                .single();

            // 2. Update upgraded user
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    subscription_tier: plan.toLowerCase(),
                    credits: (user?.credits || 0) + creditsToAdd
                })
                .eq('clerk_id', userId);

            if (updateError) {
                console.error("Failed to upgrade user in Supabase:", updateError);
            } else {
                console.log(`User ${userId} upgraded to ${plan} with ${creditsToAdd} credits`);

                // 3. Reward Referrer if exists
                if (user?.referred_by) {
                    const { data: referrer } = await supabase
                        .from('users')
                        .select('id, credits')
                        .eq('referral_code', user.referred_by)
                        .single();

                    if (referrer) {
                        await supabase
                            .from('users')
                            .update({ credits: (referrer.credits || 0) + 200 })
                            .eq('id', referrer.id);
                        console.log(`Referrer ${referrer.id} rewarded with 200 credits`);
                    }
                }
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
