/**
 * The year's total for a leave balance: everything granted — accrued,
 * carried over and adjusted by HR. Same as the web's `balanceFigures`, so
 * a card here and there agree. Leaving adjustments out showed a grant HR
 * added by hand as days the person didn't have.
 */
export function entitledDays(balance: {
  accrued: number;
  carriedOver: number;
  adjustments?: number;
}): number {
  return balance.accrued + balance.carriedOver + (balance.adjustments ?? 0);
}
