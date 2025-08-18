import { QuoteInput, QuoteResult } from "@shared/schema";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function computeQuote(input: QuoteInput, vehicleBasePrice: number, vehicleType: string): QuoteResult {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const coverageMult = input.coverage === 'PARTIAL' ? 1.25 : 1.0;
  const kmPerDay = input.kmPlan === 'KM_200' ? 5 : input.kmPlan === 'UNLIMITED' ? 10 : 0;
  const extraPerDay = input.extraDriverUnder25 ? 10 : (input.extraDriver ? 8 : 0);

  // Handle hourly packages for vans
  if (input.packageType === 'VAN_4H' || input.packageType === 'VAN_10H') {
    if (vehicleType !== 'VAN') {
      throw new Error('Fasce orarie solo furgoni');
    }
    const base = input.packageType === 'VAN_4H' ? 50 : 65;
    const delivery = (input.homeDelivery ? 30 : 0) + (input.homePickup ? 30 : 0);
    return {
      total: round2(base + delivery),
      discountEuroShown: 0,
      discountPctShown: 0,
      daysCount: 1,
      breakdown: { baseWithDiscount: base, km: 0, extra: 0, delivery }
    };
  }

  // Calculate actual days for different package types
  const actualDays = 
    input.packageType === 'WEEKLY' ? 7 : 
    input.packageType === 'MONTHLY' ? 30 : 
    input.packageType === 'THREE_DAYS' ? Math.max(3, days) : 
    input.packageType === 'FIVE_DAYS' ? Math.max(5, days) : 
    days;
  
  // Multi-day discount factors
  const factor =
    actualDays >= 30 ? 16 :
    actualDays >= 7 ? 3.5 :
    actualDays === 6 ? 3.25 :
    actualDays === 5 ? 3.0 :
    actualDays === 4 ? 2.75 :
    actualDays === 3 ? 2.25 : 
    actualDays;

  const coveredDay = vehicleBasePrice * coverageMult;
  const theoretical = coveredDay * actualDays;
  const baseWithDiscount = theoretical * (factor / actualDays);

  const km = kmPerDay * actualDays;
  const extra = extraPerDay * actualDays;
  const delivery = (input.homeDelivery ? 30 : 0) + (input.homePickup ? 30 : 0);

  const total = round2(baseWithDiscount + km + extra + delivery);

  const discountEuro = theoretical - baseWithDiscount;
  const discountEuroShown = roundTo5(discountEuro);
  const discountPctShown = roundTo5((discountEuro / theoretical) * 100);

  return {
    total,
    breakdown: {
      baseWithDiscount: round2(baseWithDiscount),
      km,
      extra,
      delivery
    },
    discountEuroShown,
    discountPctShown,
    daysCount: actualDays
  };
}
