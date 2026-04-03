import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Roommate {
  id: string;
  name: string;
  hoursPerDay: { [day: number]: number }; // day (1-31) -> hours
  vacationDays: number[]; // days of month when not at home
}

export interface BillCalculation {
  roommateId: string;
  name: string;
  totalHours: number;
  totalUsagePercentage: number;
  amountToPay: number;
  fixedCharge: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private roommates$ = new BehaviorSubject<Roommate[]>([]);
  private totalBill$ = new BehaviorSubject<number>(700);
  private fixedCharge$ = new BehaviorSubject<number>(0);
  private month$ = new BehaviorSubject<string>('2026-04');
  private totalDaysInMonth$ = new BehaviorSubject<number>(30);
  private saturationDays$ = new BehaviorSubject<number[]>([]); // Saturdays and Sundays
  private includeWeekends$ = new BehaviorSubject<boolean>(false);
  private savedMonths$ = new BehaviorSubject<string[]>([]);

  private readonly API_URL = 'https://powersplit-backend.onrender.com/api';

  constructor() {
    this.calculateSaturationDays();
    this.loadSavedMonths();
    this.loadFromBackend();
  }

  private async loadFromBackend(): Promise<void> {
    try {
      const res = await fetch(`${this.API_URL}/month/${this.month$.value}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.roommates) this.roommates$.next(data.roommates);
      if (data.totalBill) this.totalBill$.next(data.totalBill);
      if (data.fixedCharge !== undefined) this.fixedCharge$.next(data.fixedCharge);
      if (data.month) {
        this.month$.next(data.month);
        this.calculateSaturationDays();
      }
      if (data.totalDaysInMonth) this.totalDaysInMonth$.next(data.totalDaysInMonth);
      if (data.includeWeekends !== undefined) this.includeWeekends$.next(data.includeWeekends);
    } catch (error) {
      console.error('Error loading data from backend:', error);
    }
  }

  private async loadSavedMonths(): Promise<void> {
    try {
      const res = await fetch(`${this.API_URL}/months`);
      if (!res.ok) return;
      const months = await res.json();
      this.savedMonths$.next(months);
    } catch (error) {
      console.error('Error loading months list:', error);
    }
  }

  private async saveToBackend(): Promise<void> {
    try {
      const data = {
        roommates: this.roommates$.value,
        totalBill: this.totalBill$.value,
        fixedCharge: this.fixedCharge$.value,
        month: this.month$.value,
        totalDaysInMonth: this.totalDaysInMonth$.value,
        includeWeekends: this.includeWeekends$.value
      };
      await fetch(`${this.API_URL}/month/${this.month$.value}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      this.updateSavedMonths();
    } catch (error) {
      console.error('Error saving data to backend:', error);
    }
  }
  getFixedCharge(): Observable<number> {
    return this.fixedCharge$.asObservable();
  }

  async setFixedCharge(amount: number): Promise<void> {
    this.fixedCharge$.next(amount);
    await this.saveToBackend();
  }

  private async updateSavedMonths(): Promise<void> {
    await this.loadSavedMonths();
  }

  getRoommates(): Observable<Roommate[]> {
    return this.roommates$.asObservable();
  }

  getTotalBill(): Observable<number> {
    return this.totalBill$.asObservable();
  }

  getMonth(): Observable<string> {
    return this.month$.asObservable();
  }

  getTotalDaysInMonth(): Observable<number> {
    return this.totalDaysInMonth$.asObservable();
  }

  async addRoommate(name: string): Promise<void> {
    const current = this.roommates$.value;
    const newRoommate: Roommate = {
      id: Date.now().toString(),
      name,
      hoursPerDay: {},
      vacationDays: []
    };
    this.roommates$.next([...current, newRoommate]);
    await this.saveToBackend();
  }

  async removeRoommate(id: string): Promise<void> {
    const current = this.roommates$.value;
    this.roommates$.next(current.filter(r => r.id !== id));
    await this.saveToBackend();
  }

  async updateRoommateHours(roommateId: string, day: number, hours: number): Promise<void> {
    const current = this.roommates$.value;
    const roommate = current.find(r => r.id === roommateId);
    if (roommate) {
      roommate.hoursPerDay[day] = hours;
      this.roommates$.next([...current]);
      await this.saveToBackend();
    }
  }

  async setVacationDays(roommateId: string, days: number[]): Promise<void> {
    const current = this.roommates$.value;
    const roommate = current.find(r => r.id === roommateId);
    if (roommate) {
      roommate.vacationDays = days;
      this.roommates$.next([...current]);
      await this.saveToBackend();
    }
  }

  async setTotalBill(amount: number): Promise<void> {
    this.totalBill$.next(amount);
    await this.saveToBackend();
  }

  async setMonth(month: string): Promise<void> {
    this.month$.next(month);
    this.calculateSaturationDays();
    await this.saveToBackend();
  }

  async setTotalDaysInMonth(days: number): Promise<void> {
    this.totalDaysInMonth$.next(days);
    this.calculateSaturationDays();
    await this.saveToBackend();
  }

  private calculateSaturationDays(): void {
    const month = this.month$.value;
    const [year, monthStr] = month.split('-').map(Number);
    const satDays: number[] = [];

    for (let day = 1; day <= this.totalDaysInMonth$.value; day++) {
      const date = new Date(year, monthStr - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        satDays.push(day);
      }
    }
    this.saturationDays$.next(satDays);
  }

  calculateBill(): { calculations: BillCalculation[]; settlements: Settlement[] } {
    const roommates = this.roommates$.value;
    const totalBill = this.totalBill$.value;
    const fixedCharge = this.fixedCharge$.value;
    const totalDays = this.totalDaysInMonth$.value;
    const saturationDays = this.saturationDays$.value;
    const includeWeekends = this.includeWeekends$.value;

    // Calculate total hours for each roommate
    const calculations: BillCalculation[] = [];
    let grandTotalHours = 0;

    roommates.forEach(roommate => {
      let totalHours = 0;

      for (let day = 1; day <= totalDays; day++) {
        // Skip vacation days
        if (roommate.vacationDays.includes(day)) {
          continue;
        }

        // Skip weekends if includeWeekends is false
        if (!includeWeekends && saturationDays.includes(day)) {
          continue;
        }

        // Get hours for the day (default 24 if not set)
        const hours = roommate.hoursPerDay[day] !== undefined ? roommate.hoursPerDay[day] : 24;
        totalHours += hours;
      }

      calculations.push({
        roommateId: roommate.id,
        name: roommate.name,
        totalHours,
        totalUsagePercentage: 0, // Will be calculated below
        amountToPay: 0, // Will be calculated below
        fixedCharge: 0
      });

      grandTotalHours += totalHours;
    });

    // Calculate percentage and amount
    calculations.forEach(calc => {
      calc.totalUsagePercentage = grandTotalHours > 0 ? (calc.totalHours / grandTotalHours) * 100 : 0;
      // Split fixed charge equally
      calc.fixedCharge = roommates.length > 0 ? fixedCharge / roommates.length : 0;
      calc.amountToPay = (calc.totalUsagePercentage / 100) * (totalBill - fixedCharge) + calc.fixedCharge;
    });

    // Calculate settlements
    const settlements = this.calculateSettlements(calculations);

    return { calculations, settlements };
  }

  private calculateSettlements(calculations: BillCalculation[]): Settlement[] {
    const settlements: Settlement[] = [];
    const balances = new Map<string, number>();

    // Initialize balances
    calculations.forEach(calc => {
      balances.set(calc.roommateId, calc.amountToPay);
    });

    // Simple settlement algorithm
    const negativeBalances = Array.from(balances.entries())
      .filter(([_, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1]);

    const positiveBalances = Array.from(balances.entries())
      .filter(([_, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1]);

    negativeBalances.forEach(([negId, negAmount]) => {
      positiveBalances.forEach(([posId, posAmount]) => {
        if (negAmount !== 0 && posAmount > 0) {
          const settlement = Math.min(Math.abs(negAmount), posAmount);
          settlements.push({
            from: this.getRoommateNameById(negId),
            to: this.getRoommateNameById(posId),
            amount: settlement
          });
          negAmount += settlement;
          positiveBalances[positiveBalances.findIndex(([id]) => id === posId)][1] -= settlement;
        }
      });
    });

    return settlements;
  }

  private getRoommateNameById(id: string): string {
    const roommate = this.roommates$.value.find(r => r.id === id);
    return roommate ? roommate.name : 'Unknown';
  }

  getSaturationDays(): Observable<number[]> {
    return this.saturationDays$.asObservable();
  }

  getIncludeWeekends(): Observable<boolean> {
    return this.includeWeekends$.asObservable();
  }

  async setIncludeWeekends(include: boolean): Promise<void> {
    this.includeWeekends$.next(include);
    await this.saveToBackend();
  }

  getSavedMonths(): Observable<string[]> {
    this.loadSavedMonths();
    return this.savedMonths$.asObservable();
  }

  async loadMonthData(month: string): Promise<void> {
    this.month$.next(month);
    this.calculateSaturationDays();
    await this.loadFromBackend();
  }

  async deleteMonth(month: string): Promise<void> {
    try {
      await fetch(`${this.API_URL}/month/${month}`, { method: 'DELETE' });
      await this.loadSavedMonths();
    } catch (error) {
      console.error('Error deleting month:', error);
    }
  }

  async reset(): Promise<void> {
    this.roommates$.next([]);
    this.totalBill$.next(700);
    this.month$.next('2026-04');
    this.totalDaysInMonth$.next(30);
    this.includeWeekends$.next(false);
    this.calculateSaturationDays();
    await this.saveToBackend();
  }

  async clearStorage(): Promise<void> {
    try {
      // Delete all months from backend
      const months = this.savedMonths$.value;
      for (const m of months) {
        await fetch(`${this.API_URL}/month/${m}`, { method: 'DELETE' });
      }
      this.savedMonths$.next([]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}
