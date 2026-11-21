import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TripsListComponent } from './components/trips-list/trips-list.component';
import { CreateTripComponent } from './components/create-trip/create-trip.component';
import { TripDetailsComponent } from './components/trip-details/trip-details.component';
import { OwnPartnersComponent } from './components/own-partners/own-partners.component';
import { TeamMembersComponent } from './components/team-members/team-members.component';
import { MemberDetailsComponent } from './components/member-details/member-details.component';
import { PublicTripComponent } from './components/public-trip/public-trip.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'trips', component: TripsListComponent, canActivate: [authGuard] },
  { path: 'trips/create', component: CreateTripComponent, canActivate: [authGuard] },
  { path: 'trips/:id', component: TripDetailsComponent, canActivate: [authGuard] },
  { path: 'trips/:id/edit', component: CreateTripComponent, canActivate: [authGuard] },
  { path: 'resources', component: OwnPartnersComponent, canActivate: [authGuard] },
  { path: 'team', component: TeamMembersComponent, canActivate: [authGuard] },
  { path: 'team/:id', component: MemberDetailsComponent, canActivate: [authGuard] },
  { path: 'public/trips/:slug', component: PublicTripComponent },
  { path: 'trips/public/:slug', component: PublicTripComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
