import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import {
  TripListItem,
  TripDetail,
  PagedResult,
  ResourceType,
  ResourceItem,
  MemberItem,
  PaymentItem,
  DashboardStats,
  CustomField,
  PublicTrip
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private baseUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const tenantId = this.auth.getTenantId();
    if (tenantId) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }
    return headers;
  }

  private handleError = (error: any) => {
    const message = error.error?.message || error.message || 'Something went wrong. Please try again.';
    this.toast.error(message);
    return throwError(() => error);
  };

  // Health
  getHealth(): Observable<any> {
    const healthUrl = environment.apiUrl.replace(/\/api$/, '') + '/health';
    return this.http.get(healthUrl);
  }

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Trips
  getTrips(params: {
    status?: string;
    tripId?: string;
    tripName?: string;
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDesc?: boolean;
  }): Observable<PagedResult<TripListItem>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });

    return this.http.get<PagedResult<TripListItem>>(`${this.baseUrl}/trips`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(catchError(this.handleError));
  }

  getTripById(id: string): Observable<TripDetail> {
    return this.http.get<TripDetail>(`${this.baseUrl}/trips/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createTrip(payload: any): Observable<TripDetail> {
    return this.http.post<TripDetail>(`${this.baseUrl}/trips`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateTrip(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/trips/${id}`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  publishTrip(id: string): Observable<{ message: string; publicSlug: string; publicUrl: string }> {
    return this.http.post<any>(`${this.baseUrl}/trips/${id}/publish`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  unpublishTrip(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${id}/unpublish`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  duplicateTrip(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${id}/duplicate`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteTrip(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/trips/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateTripStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/trips/${id}/status`, { status }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  addTraveller(tripId: string, traveller: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/travellers`, traveller, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteTraveller(tripId: string, travellerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/trips/${tripId}/travellers/${travellerId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  addItineraryDay(tripId: string, day: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/days`, day, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteItineraryDay(tripId: string, dayId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/trips/${tripId}/days/${dayId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  addSchedule(tripId: string, schedule: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/schedules`, schedule, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateSchedule(tripId: string, scheduleId: string, schedule: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/trips/${tripId}/schedules/${scheduleId}`, schedule, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteSchedule(tripId: string, scheduleId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/trips/${tripId}/schedules/${scheduleId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  assignTeamMember(tripId: string, assignment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/team`, assignment, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  assignResource(tripId: string, assignment: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/resources`, assignment, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getTripsExportUrl(): string {
    return `${this.baseUrl}/trips/export`;
  }

  // Public Trip
  getPublicTrip(slug: string): Observable<PublicTrip> {
    return this.http.get<PublicTrip>(`${this.baseUrl}/public/trips/${slug}`)
      .pipe(catchError(this.handleError));
  }

  // Resources
  getResourceTypes(): Observable<ResourceType[]> {
    return this.http.get<ResourceType[]>(`${this.baseUrl}/resources/types`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createResourceType(payload: any): Observable<ResourceType> {
    return this.http.post<ResourceType>(`${this.baseUrl}/resources/types`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getResources(params: {
    typeKey?: string;
    search?: string;
    ownership?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<ResourceItem>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, val.toString());
      }
    });

    return this.http.get<PagedResult<ResourceItem>>(`${this.baseUrl}/resources`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(catchError(this.handleError));
  }

  createResource(payload: any): Observable<ResourceItem> {
    return this.http.post<ResourceItem>(`${this.baseUrl}/resources`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateResource(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/resources/${id}`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/resources/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Members
  getMembers(params: { role?: string; search?: string; status?: string } = {}): Observable<MemberItem[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          httpParams = httpParams.set(key, val.toString());
        }
      });
    }

    return this.http.get<MemberItem[]>(`${this.baseUrl}/members`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(catchError(this.handleError));
  }

  getMemberById(id: string): Observable<MemberItem> {
    return this.http.get<MemberItem>(`${this.baseUrl}/members/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createMember(payload: any): Observable<MemberItem> {
    return this.http.post<MemberItem>(`${this.baseUrl}/members`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateMember(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/members/${id}`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteMember(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/members/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Payments
  getPayments(memberId?: string, tripId?: string): Observable<PaymentItem[]> {
    let params = new HttpParams();
    if (memberId) params = params.set('memberId', memberId);
    if (tripId) params = params.set('tripId', tripId);

    return this.http.get<PaymentItem[]>(`${this.baseUrl}/payments`, {
      headers: this.getHeaders(),
      params
    }).pipe(catchError(this.handleError));
  }

  createPayment(payload: any): Observable<PaymentItem> {
    return this.http.post<PaymentItem>(`${this.baseUrl}/payments`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Custom Fields
  getCustomFields(entity?: string, includeArchived = false): Observable<CustomField[]> {
    let params = new HttpParams();
    if (entity) params = params.set('entity', entity);
    if (includeArchived) params = params.set('includeArchived', 'true');

    return this.http.get<CustomField[]>(`${this.baseUrl}/custom-fields`, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  createCustomField(payload: any): Observable<CustomField> {
    return this.http.post<CustomField>(`${this.baseUrl}/custom-fields`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateCustomField(id: string, payload: any): Observable<CustomField> {
    return this.http.put<CustomField>(`${this.baseUrl}/custom-fields/${id}`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  archiveCustomField(id: string, archive = true): Observable<any> {
    return this.http.put(`${this.baseUrl}/custom-fields/${id}/archive?archive=${archive}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  reorderCustomFields(fieldIds: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/custom-fields/reorder`, { fieldIds }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // File Upload
  uploadFile(file: File, folder = 'general'): Observable<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ fileUrl: string; fileName: string }>(`${this.baseUrl}/uploads?folder=${folder}`, formData)
      .pipe(catchError(this.handleError));
  }
}

