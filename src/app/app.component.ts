import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BillService, BillCalculation, Settlement, Roommate } from './services/bill.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
    showHourDialog = false;
    dialogDay: number = 1;
    dialogHours: number = 24;
    openHourDialog(day: number): void {
      this.dialogDay = day;
      this.dialogHours = this.getRoommateHours(day);
      this.showHourDialog = true;
    }

    closeHourDialog(): void {
      this.showHourDialog = false;
    }

    saveDialogHours(): void {
      this.updateRoommateHours(this.dialogDay, { target: { value: this.dialogHours } });
      this.closeHourDialog();
    }
  title = 'PowerSplit';

  month: string = '2026-04';
  totalBill: number = 700;
  totalDays: number = 30;
  newRoommateName: string = '';
  includeWeekends: boolean = false;
  
  roommates: Roommate[] = [];
  selectedRoommateId: string = '';
  vacationDaysInput: string = '';
  
  savedMonths: string[] = [];

  showResults: boolean = false;
  calculations: BillCalculation[] = [];
  settlements: Settlement[] = [];

  constructor(public billService: BillService) {}

  ngOnInit(): void {
    this.billService.getRoommates().subscribe(roommates => {
      this.roommates = roommates;
      if (!this.selectedRoommateId && roommates.length > 0) {
        this.selectedRoommateId = roommates[0].id;
      }
      // Auto-recalculate if results are already shown
      if (this.showResults) {
        this.calculateBill();
      }
    });

    this.billService.getTotalBill().subscribe(bill => {
      this.totalBill = bill;
      if (this.showResults) {
        this.calculateBill();
      }
    });

    this.billService.getMonth().subscribe(month => {
      this.month = month;
      if (this.showResults) {
        this.calculateBill();
      }
    });

    this.billService.getTotalDaysInMonth().subscribe(days => {
      this.totalDays = days;
      if (this.showResults) {
        this.calculateBill();
      }
    });

    this.billService.getIncludeWeekends().subscribe(include => {
      this.includeWeekends = include;
      if (this.showResults) {
        this.calculateBill();
      }
    });

    this.billService.getSavedMonths().subscribe(months => {
      this.savedMonths = months;
    });
  }

  updateMonth(): void {
    this.billService.setMonth(this.month);
    this.billService.setTotalDaysInMonth(this.getDaysInMonth(this.month));
  }

  getDaysInMonth(monthStr: string): number {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }

  addRoommate(): void {
    if (this.newRoommateName.trim()) {
      this.billService.addRoommate(this.newRoommateName);
      this.newRoommateName = '';
    }
  }

  removeRoommate(id: string): void {
    this.billService.removeRoommate(id);
    if (this.selectedRoommateId === id && this.roommates.length > 0) {
      this.selectedRoommateId = this.roommates[0].id;
    }
  }

  updateRoommateHours(day: number, event: any): void {
    const hours = parseInt(event.target.value);
    if (this.selectedRoommateId && !isNaN(hours)) {
      this.billService.updateRoommateHours(this.selectedRoommateId, day, hours);
    }
  }

  getRoommateHours(day: number): number {
    const roommate = this.roommates.find(r => r.id === this.selectedRoommateId);
    if (roommate && roommate.hoursPerDay[day] !== undefined) {
      return roommate.hoursPerDay[day];
    }
    return 24;
  }

  getSelectedRoomateMateVacationDays(): number[] {
    const roommate = this.roommates.find(r => r.id === this.selectedRoommateId);
    return roommate?.vacationDays || [];
  }

  hasVacationDays(): boolean {
    return this.getSelectedRoomateMateVacationDays().length > 0;
  }

  loadMonthData(month: string): void {
    this.billService.loadMonthData(month);
    this.showResults = false;
  }

  deleteMonthData(month: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete data for ${month}?`)) {
      this.billService.deleteMonth(month);
    }
  }

  formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getTotalHoursForSelectedRoommate(): number {
    const roommate = this.roommates.find(r => r.id === this.selectedRoommateId);
    if (!roommate) return this.totalDays * 24;
    const vacationDays = roommate.vacationDays?.length || 0;
    return (this.totalDays - vacationDays) * 24;
  }

  isDayVacation(day: number): boolean {
    return this.hasVacationDays() && this.getSelectedRoomateMateVacationDays().includes(day);
  }

  isPartialHours(day: number): boolean {
    return this.getRoommateHours(day) < 24;
  }

  getRowClass(day: number): string {
    const isVacation = this.isDayVacation(day);
    const isPartial = this.isPartialHours(day);

    if (isVacation) {
      return 'h-16 rounded-lg flex flex-col items-center justify-center group cursor-pointer transition-colors border bg-tertiary-fixed-dim/20 text-tertiary border-tertiary-fixed-dim/40';
    }
    if (isPartial) {
      return 'h-16 rounded-lg flex flex-col items-center justify-center group cursor-pointer transition-colors border bg-surface border-outline-variant/10 hover:bg-primary-container hover:text-white';
    }
    return 'h-16 rounded-lg flex flex-col items-center justify-center group cursor-pointer transition-colors border bg-primary-container text-white border-outline-variant/10';
  }

  getDayNumberClass(day: number): string {
    const isVacation = this.isDayVacation(day);
    const isPartial = this.isPartialHours(day);

    if (isVacation) {
      return 'text-[10px] font-bold text-tertiary/60';
    }
    if (isPartial) {
      return 'text-[10px] font-bold text-on-surface-variant group-hover:text-white/60';
    }
    return 'text-[10px] font-bold text-white/60';
  }

  shouldShowOff(day: number): boolean {
    return this.isDayVacation(day);
  }

  getDaysArray(): number[] {
    return Array.from({ length: this.totalDays }, (_, i) => i + 1);
  }

  addVacationDays(): void {
    if (this.selectedRoommateId && this.vacationDaysInput.trim()) {
      const days = this.vacationDaysInput.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
      this.billService.setVacationDays(this.selectedRoommateId, days);
      this.vacationDaysInput = '';
    }
  }

  getVacationDaysText(roommateId: string): string {
    const roommate = this.roommates.find(r => r.id === roommateId);
    return roommate ? roommate.vacationDays.join(', ') : '-';
  }

  calculateBill(): void {
    const result = this.billService.calculateBill();
    this.calculations = result.calculations;
    this.settlements = result.settlements;
    this.showResults = true;
  }

  resetApp(): void {
    this.billService.reset();
    this.showResults = false;
    this.calculations = [];
    this.settlements = [];
    this.vacationDaysInput = '';
    this.newRoommateName = '';
  }

  toggleWeekends(): void {
    this.billService.setIncludeWeekends(!this.includeWeekends);
  }

  clearAllData(): void {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      this.billService.clearStorage();
      this.resetApp();
    }
  }
}
