import type { Gender, BodyComposition } from '../types';

/**
 * Calculate body fat percentage using US Navy method
 * 
 * Men:   BF% = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
 * Women: BF% = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
 * 
 * @param waist - Waist circumference in cm (at navel level)
 * @param neck - Neck circumference in cm (below Adam's apple)
 * @param height - Height in cm
 * @param gender - 'male' | 'female'
 * @param hip - Hip circumference in cm (only for women)
 * @returns Body fat percentage (0-100)
 */
export function calculateBodyFatPercentage(
  waist: number,
  neck: number,
  height: number,
  gender: Gender,
  hip?: number
): number {
  if (gender === 'male') {
    // Men formula
    const value = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    return Math.max(0, Math.min(100, value)); // Clamp to 0-100%
  } else {
    // Women formula (requires hip measurement)
    if (!hip || hip <= 0) {
      throw new Error('Hip measurement required for female body fat calculation');
    }
    const value = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    return Math.max(0, Math.min(100, value)); // Clamp to 0-100%
  }
}

/**
 * Calculate full body composition metrics
 * 
 * @param weight - Total body weight in kg
 * @param waist - Waist circumference in cm
 * @param neck - Neck circumference in cm
 * @param height - Height in cm
 * @param gender - 'male' | 'female'
 * @param hip - Hip circumference in cm (only for women)
 * @returns BodyComposition object with BF%, fat mass, and lean body mass
 */
export function calculateBodyComposition(
  weight: number,
  waist: number,
  neck: number,
  height: number,
  gender: Gender,
  hip?: number
): BodyComposition {
  const bodyFatPercentage = calculateBodyFatPercentage(waist, neck, height, gender, hip);
  const fatMass = (weight * bodyFatPercentage) / 100;
  const leanBodyMass = weight - fatMass;

  return {
    bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10, // 1 decimal
    fatMass: Math.round(fatMass * 10) / 10,                     // 1 decimal
    leanBodyMass: Math.round(leanBodyMass * 10) / 10            // 1 decimal
  };
}

/**
 * Calculate 7-day rolling average
 * 
 * @param values - Array of numbers
 * @returns Average or undefined if array is empty
 */
export function calculate7DayAverage(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10; // 1 decimal
}

/**
 * Calculate 7-day trend (current vs previous week average)
 * 
 * @param current - Current value
 * @param average7d - 7-day average value
 * @returns Trend difference (positive = increase, negative = decrease)
 */
export function calculate7DayTrend(
  current: number,
  average7d: number | undefined
): number | undefined {
  if (average7d === undefined) return undefined;
  return Math.round((current - average7d) * 10) / 10; // 1 decimal
}

/**
 * Calculate weekly weight change rate
 * 
 * @param currentWeight - Current weight in kg
 * @param previousWeekWeight - Weight from 7 days ago in kg
 * @returns Percentage change per week (negative = weight loss)
 */
export function calculateWeeklyWeightChangeRate(
  currentWeight: number,
  previousWeekWeight: number
): number {
  const change = ((currentWeight - previousWeekWeight) / previousWeekWeight) * 100;
  return Math.round(change * 10) / 10; // 1 decimal
}

/**
 * Classify weekly weight change rate
 * 
 * - optimal: -0.5% to -1.5% per week (sustainable fat loss, preserves muscle)
 * - aggressive: < -1.5% per week (too fast, risk of muscle loss)
 * - slow: > -0.5% or positive (maintenance or weight gain)
 * 
 * @param weeklyChangeRate - Percentage change per week
 * @returns Status classification
 */
export function classifyWeeklyChangeRate(
  weeklyChangeRate: number
): 'optimal' | 'aggressive' | 'slow' {
  if (weeklyChangeRate <= -1.5) return 'aggressive';
  if (weeklyChangeRate < -0.5) return 'optimal';
  return 'slow';
}
