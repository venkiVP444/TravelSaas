import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, Tenant, LoginResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'v4journey_token';
  private readonly USER_KEY = 'v4journey_user';
  private readonly TENANT_KEY = 'v4journey_tenant';

  currentUser = signal<User | null>(this.getStoredUser());
  currentTenant = signal<Tenant | null>(this.getStoredTenant());

  private readonly authUrl = `${environment.apiUrl}/auth`;

  constructor() {
    // Check if session exists in storage
    const storedUser = this.getStoredUser();
    const storedTenant = this.getStoredTenant();
    if (storedUser && storedTenant) {
      this.currentUser.set(storedUser);
      this.currentTenant.set(storedTenant);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, credentials).pipe(
      tap(res => {
        this.setSession(res.token, res.user, res.tenant);
      })
    );
  }

  setSession(token: string, user: User, tenant: Tenant) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
    this.currentUser.set(user);
    this.currentTenant.set(tenant);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getTenantId(): string {
    return this.currentTenant()?.id || '11111111-1111-1111-1111-111111111111';
  }

  switchTenant(tenant: Tenant) {
    this.currentTenant.set(tenant);
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
  }

  setTenant(tenant: Tenant) {
    this.switchTenant(tenant);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_KEY);
    this.currentUser.set(null);
    this.currentTenant.set(null);
    this.router.navigate(['/login']);
  }

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getStoredTenant(): Tenant | null {
    try {
      const raw = localStorage.getItem(this.TENANT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
