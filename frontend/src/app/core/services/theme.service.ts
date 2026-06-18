import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkThemeSubject = new BehaviorSubject<boolean>(false);
  public isDarkTheme$ = this.darkThemeSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('hms_dark_theme');
    const isDark = savedTheme === 'true';
    this.setDarkTheme(isDark);
  }

  toggleTheme(): void {
    this.setDarkTheme(!this.darkThemeSubject.value);
  }

  setDarkTheme(isDark: boolean): void {
    this.darkThemeSubject.next(isDark);
    localStorage.setItem('hms_dark_theme', isDark.toString());

    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  get isDark(): boolean {
    return this.darkThemeSubject.value;
  }
}
