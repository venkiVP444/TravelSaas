export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  tenant: Tenant;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TripListItem {
  id: string;
  tripCode: string;
  name: string;
  category: string;
  location: string;
  tripPeriod: string;
  days: string;
  lastBookingDate: string;
  tripStatus: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  adultPrice: number;
  childPrice: number;
  isPublished: boolean;
  publicSlug?: string;
}

export interface TripDetail {
  id: string;
  tripCode: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category: string;
  origin: string;
  destination: string;
  via?: string;
  startDateTime: string;
  endDateTime: string;
  duration: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  foodInfo: string;
  pickupDrop: string;
  adultPrice: number;
  adultSpends: number;
  adultMargin: number;
  childPrice: number;
  childSpends: number;
  childMargin: number;
  totalIncome: number;
  totalExpenses: number;
  totalProfit: number;
  status: string;
  isPublished: boolean;
  publicSlug?: string;
  publishedAt?: string;
  createdAt: string;
  customFieldsJson: string;
  days: TripItineraryDay[];
  schedules: TripSchedule[];
  travellers: TripTraveller[];
  teamMembers: TripTeamMember[];
  resources: TripResource[];
  assignedTeamMemberIds?: string[];
  assignedResourceIds?: string[];
}

export interface TripItineraryDay {
  id?: string;
  dayNumber: number;
  title: string;
  dayDate: string;
  schedules: TripSchedule[];
}

export interface TripSchedule {
  id?: string;
  dayId?: string;
  dayNumber: number;
  dayDate: string;
  timeString: string;
  activity: string;
  description?: string;
  origin?: string;
  destination?: string;
  activityType?: string;
  status?: string;
  assignedPersonResource?: string;
  notes?: string;
  location?: string;
}

export interface TripTraveller {
  id?: string;
  travellerName: string;
  age?: number;
  gender?: string;
  ageGender: string;
  contact: string;
  type: string;
  pickupLocation?: string;
  dropLocation?: string;
  paymentStatus: string;
  paidAmount: number;
  balanceAmount: number;
  foodInfo: string;
  customFieldsJson?: string;
}

export interface AddTravellerPayload {
  travellerName: string;
  age?: number;
  gender?: string;
  contact?: string;
  type?: string;
  pickupLocation?: string;
  dropLocation?: string;
  paymentStatus?: string;
  paidAmount?: number;
  balanceAmount?: number;
  foodInfo?: string;
  customFieldsJson?: string;
}

export interface CreateTripPayload {
  tripCode?: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category: string;
  origin: string;
  destination: string;
  via?: string;
  startDateTime: string;
  endDateTime: string;
  duration: string;
  totalSeats: number;
  foodInfo: string;
  pickupDrop: string;
  adultPrice: number;
  adultSpends: number;
  adultMargin: number;
  childPrice: number;
  childSpends: number;
  childMargin: number;
  status?: string;
  customFieldsJson?: string;
  assignedMemberIds?: string[];
  assignedResourceIds?: string[];
  days?: any[];
  schedules?: any[];
}

export interface TripTeamMember {
  id?: string;
  memberId: string;
  memberCode: string;
  name: string;
  contact: string;
  role: string;
  ageGender: string;
  licenseNo?: string;
  workType: string;
  foodInfo: string;
}

export interface TripResource {
  id?: string;
  resourceId: string;
  resourceCode: string;
  name: string;
  resourceType: string;
  ownership: string;
  notes?: string;
}

export interface ResourceType {
  id: string;
  key: string;
  displayName: string;
  icon: string;
  displayOrder: number;
  isSystem: boolean;
  fields: ResourceField[];
}

export interface ResourceField {
  id?: string;
  fieldKey: string;
  label: string;
  dataType: string;
  isRequired: boolean;
  showInTable: boolean;
  optionsJson?: string;
  displayOrder: number;
}

export interface ResourceItem {
  id: string;
  resourceTypeId: string;
  resourceTypeKey: string;
  resourceTypeName: string;
  resourceType?: string;
  code: string;
  name: string;
  identificationNo?: string;
  ownership: string;
  partnerName?: string;
  contactNo?: string;
  address?: string;
  status: string;
  pictureUrl?: string;
  insurancePeriod?: string;
  currentTripName?: string;
  customValuesJson: string;
  createdAt: string;
}

export interface MemberItem {
  id: string;
  memberCode: string;
  fullName: string;
  email: string;
  mobileNo: string;
  aadhaarNo?: string;
  licenseNo?: string;
  dateOfBirth?: string;
  age: number;
  gender: string;
  bloodGroup: string;
  foodInfo: string;
  role: string;
  workType: string;
  contractPeriod: string;
  workJoinDate: string;
  workEndDate?: string;
  salaryPeriod: string;
  address?: string;
  photoUrl?: string;
  documentUrl?: string;
  status: string;
  customFieldsJson: string;
  tripsAttemptCount: number;
  totalEarnings: number;
  totalBalance: number;
}

export interface PaymentItem {
  id: string;
  tripId?: string;
  tripCode?: string;
  tripName?: string;
  memberId?: string;
  memberName?: string;
  amount: number;
  balance: number;
  paymentMode: string;
  status: string;
  paymentDate: string;
  workingPeriod?: string;
  daysCount?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  totalRevenue: number;
  totalTravellers: number;
  activeResources: number;
  totalTeamMembers: number;
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  description: string;
  timestamp: string;
}

export interface CustomField {
  id: string;
  targetEntity: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  showInTable: boolean;
  optionsJson?: string;
  defaultValue?: string;
  sortOrder?: number;
  isArchived?: boolean;
  validationRulesJson?: string;
}

export interface PublicTrip {
  tripCode: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category: string;
  origin: string;
  destination: string;
  via?: string;
  startDateTime: string;
  endDateTime: string;
  duration: string;
  totalSeats: number;
  availableSeats: number;
  foodInfo: string;
  pickupDrop: string;
  adultPrice: number;
  childPrice: number;
  companyName: string;
  companyLogo?: string;
  itinerary: PublicItineraryItem[];
}

export interface PublicItineraryItem {
  dayNumber: number;
  dayDate: string;
  timeString: string;
  activity: string;
  location?: string;
}
