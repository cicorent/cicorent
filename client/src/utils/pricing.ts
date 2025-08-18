export class PricingUtils {
    /** Calcola i giorni inclusivi (start e end compresi) */
    static daysInclusive(start: Date | null, end: Date | null): number {
      if (!start || !end) return 0;
      const msPerDay = 1000 * 60 * 60 * 24;
      return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    }
  
    /** 
     * Recupera la configurazione prezzi per il veicolo 
     * (puoi aggiungerne altri qui in futuro) 
     */
    static getVehiclePrices(vehicleName: string) {
      type KmType = "KM_100" | "KM_200" | "UNLIMITED";
      type Reduction = "NONE" | "4H" | "10H";
  
      interface VehiclePricing {
        basePriceDay: number;
        supportsReduction: boolean;
        sameDay: Record<Reduction, Partial<Record<KmType, number>>>;
        multiDay: Record<KmType, Record<number, number>>; // giorni → moltiplicatore
        insuranceCost: (days: number, reduction: Reduction) => number;
      }
  
      const polo: VehiclePricing = {
        basePriceDay: 60,
        supportsReduction: false,
        sameDay: {
          "NONE": { "KM_100": 1.0, "UNLIMITED": 65 / 60 },
          "4H": {},
          "10H": {}
        },
        multiDay: {
          "KM_100": { 2: 110 / 60, 3: 120 / 60 },
          "UNLIMITED": {
            2: 120 / 60,
            3: 130 / 60,
            4: 140 / 60,
            5: 175 / 60,
            6: 205 / 60,
            7: 210 / 60,
            30: 950 / 60
          },
          "KM_200": {}
        },
        insuranceCost: (days) => days >= 30 ? days * 8 : days * 15
      };
  
      const crafter: VehiclePricing = {
        basePriceDay: 80,
        supportsReduction: true,
        sameDay: {
          "4H": { "KM_100": 50 / 80 },
          "10H": {
            "KM_100": 65 / 80,
            "KM_200": 85 / 80,
            "UNLIMITED": 100 / 80
          },
          "NONE": {
            "KM_100": 1.0,
            "KM_200": 100 / 80,
            "UNLIMITED": 110 / 80
          }
        },
        multiDay: {
          "KM_100": {
            2: 150 / 80,
            3: 225 / 80,
            4: 280 / 80,
            5: 340 / 80,
            6: 390 / 80,
            7: 450 / 80,
            30: 1600 / 80
          },
          "UNLIMITED": {
            2: 210 / 80,
            3: 315 / 80,
            4: 390 / 80,
            5: 475 / 80,
            6: 540 / 80,
            7: 620 / 80,
            30: 2000 / 80
          },
          "KM_200": {}
        },
        insuranceCost: (days, reduction) => {
          if (days === 1) {
            if (reduction === "4H") return 10;
            if (reduction === "10H") return 20;
            return 20;
          }
          if (days <= 3) return days * 20;
          if (days <= 7) return days * 15;
          return days * 10;
        }
      };
  
      const name = vehicleName.toLowerCase();
      if (name.includes("crafter")) return crafter;
      if (name.includes("polo")) return polo;
      throw new Error(`Veicolo non supportato: ${vehicleName}`);
    }
  
    /** Seleziona il prezzo da ancore multi-day */
    static priceByAnchors(
      base24h100: number,
      kmPlan: string,
      days: number,
      anchors: Record<number, number>
    ): number {
      const sorted = Object.keys(anchors).map(Number).sort((a, b) => a - b);
      let anchorDays = sorted[0];
      for (const k of sorted) {
        if (k <= days) anchorDays = k; else break;
      }
      const anchorMultiplier = anchors[anchorDays];
      const anchorPrice = base24h100 * anchorMultiplier;
      const dailyRate = anchorPrice / anchorDays;
      return Math.round(dailyRate * days);
    }
  
    /** Nuovo calcolo prezzi integrato */
    static compute(opts: {
      vehicle: string;
      startDate: Date;
      endDate: Date;
      kmPlan: 'KM_100' | 'KM_200' | 'UNLIMITED';
      coverage: 'BASE' | 'PARTIAL';
      extraDriver: boolean;
      extraDriverUnder25: boolean;
      homeDelivery: boolean;
      homePickup: boolean;
      reduction?: 'NONE' | '4H' | '10H';
    }) {
      const days = this.daysInclusive(opts.startDate, opts.endDate);
      const reduction = opts.reduction ?? 'NONE';
      const cfg = this.getVehiclePrices(opts.vehicle);
  
      let basePrice = 0;
      if (days === 1) {
        const m = cfg.sameDay[reduction]?.[opts.kmPlan];
        if (m === undefined) throw new Error(`Tariffa non definita per ${opts.vehicle} – ${reduction} – ${opts.kmPlan}`);
        basePrice = Math.round(cfg.basePriceDay * m);
      } else {
        const anchors = cfg.multiDay[opts.kmPlan];
        if (!anchors || Object.keys(anchors).length === 0) {
          throw new Error(`Tariffa non disponibile per ${opts.vehicle} – ${opts.kmPlan} – ${days} giorni`);
        }
        basePrice = this.priceByAnchors(cfg.basePriceDay, opts.kmPlan, days, anchors);
      }
  
      // 2) calcolo baseRaw = (24H-100KM per giorno) × (maggiorazione KM del solo 24H) × giorni
      const perDayUplift =
      cfg.sameDay["NONE"]?.[opts.kmPlan] ??
      (() => { throw new Error(`Maggiorazione 24H non definita per ${opts.vehicle} – ${opts.kmPlan}`) })();
  
      const baseRaw = Math.round(cfg.basePriceDay * perDayUplift * days);
  
      // 3) sconto sul SOLO base (raw - scontato)
      const discountEuro = Math.max(0, baseRaw - basePrice);
      const discountPct = baseRaw > 0 ? +( (discountEuro / baseRaw) * 100 ).toFixed(2) : 0;
  
      const insurance = cfg.insuranceCost(days, reduction);
  
      const extras: { name: string; price: number }[] = [];
  
      if (opts.coverage === 'PARTIAL') extras.push({ name: 'Copertura "Meno Stress"', price: insurance });
      if (opts.extraDriverUnder25) extras.push({ name: 'Conducente under 25', price: 10 * days });
      if (opts.extraDriver) extras.push({ name: 'Conducente aggiuntivo', price: 8 * days });
      if (opts.homeDelivery) extras.push({ name: 'Consegna a domicilio', price: 30 });
      if (opts.homePickup) extras.push({ name: 'Ritiro a domicilio', price: 30 });
  
      const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
      const rawTotal = baseRaw + extrasTotal;
      const total = basePrice + extrasTotal;
  
      return {
        days,
        baseTotal: baseRaw,
        discountPct,
        discountEuro,
        rawTotal,
        total,
        extras
      };
    }
  }
  